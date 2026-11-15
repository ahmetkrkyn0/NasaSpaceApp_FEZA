"""Record live API answers for offline research scenarios (#111).

Run against a server with kernels, horizons and layers configured::

    python backend/scripts/record_examples.py --base-url http://127.0.0.1:8000

Responses are preserved verbatim inside provenance envelopes. A fixed
--recorded-utc and --main-sha make repeated runs byte-identical on one server.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
START = "2026-12-01T00:00:00Z"
END = "2026-12-31T00:00:00Z"
SITE_ENDPOINTS = ("events", "sky-series", "now", "comm-window", "power", "eclipses", "horizon", "earth-link")
WEIGHTS = {"sunlit": 1, "dark": 1, "earth": 1, "slope": 1, "roughness": 0.5, "psr_distance": 0}


def http_caller(base_url):
    def call(method, endpoint, params=None, body=None):
        query = urllib.parse.urlencode(params or {})
        url = f"{base_url.rstrip('/')}/api/{endpoint}" + (f"?{query}" if query else "")
        request = urllib.request.Request(
            url, data=json.dumps(body).encode() if body is not None else None,
            headers={"Content-Type": "application/json"}, method=method,
        )
        with urllib.request.urlopen(request, timeout=300) as response:
            return json.load(response)
    return call


def site_requests(site_id):
    location = {"site_id": site_id, "mast_height_m": 2}
    span = {**location, "start_utc": START, "end_utc": END}
    return {
        "events": {**span, "earth_criterion": "center"},
        # 6-hour samples keep all catalogue sites and candidates below 6 MB.
        # Event endpoints still find transitions at their normal precision.
        "sky-series": {**location, "start_utc": START, "hours": 720, "step_minutes": 360},
        "now": {**location, "utc": START, "earth_criterion": "center"},
        "comm-window": {**location, "utc": START, "earth_criterion": "center"},
        "power": {**span, "panel_profile_id": "vertical_tracking"},
        "eclipses": span,
        "horizon": location,
        "earth-link": {**span, "earth_criterion": "center"},
    }


def record(call, output, *, recorded_utc=None, main_sha=None):
    health = call("GET", "health", None, None)
    if not health.get("ok") or not health.get("kernels_loaded"):
        raise RuntimeError("Recording requires a ready server with SPICE kernels loaded.")
    recorded_utc = recorded_utc or datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    main_sha = main_sha or subprocess.check_output(["git", "rev-parse", "origin/main"], cwd=ROOT, text=True).strip()
    output = Path(output)
    files = {}

    def capture(folder, endpoint, params, method="GET", body=None, response=None):
        response = call(method, endpoint, params, body) if response is None else response
        envelope = {
            "recorded_utc": recorded_utc, "main_sha": main_sha,
            "server_version": "0.1.0", "method": method,
            "endpoint": f"/api/{endpoint}", "params": body if body is not None else params,
            "response": response,
        }
        files[f"{folder}/{endpoint}.json"] = envelope
        return response

    sites = call("GET", "sites", None, None)
    candidates = capture("region", "candidates", {"region": "mons-mouton"})
    capture("region", "body-series", {"start_utc": START, "end_utc": END, "step_s": 21600})
    capture("region", "recommend", None, "POST", {
        "region": "mons-mouton", "start_utc": START, "end_utc": END,
        "mast_height_m": 2, "weights": WEIGHTS, "limits": {"max_slope_deg": 12},
        "psr_preference": "far", "include_catalogue_sites": True,
    })
    places = {p["id"]: p for p in [*sites, *candidates["candidates"]]}
    for site_id in sorted(places):
        if not re.fullmatch(r"[a-z0-9-]+", site_id):
            raise ValueError(f"Unsafe place id: {site_id!r}")
        for endpoint, params in site_requests(site_id).items():
            capture(site_id, endpoint, params)
        print(f"Recorded {site_id}", flush=True)
    manifest = {
        "recorded_utc": recorded_utc, "main_sha": main_sha,
        "server_version": "0.1.0", "start_utc": START, "end_utc": END,
        "mast_height_m": 2, "panel_profile_id": "vertical_tracking",
        "sky_step_minutes": 360,
        "places": [{"id": key, "name": places[key]["name"]} for key in sorted(places)],
    }
    files["index.json"] = manifest
    encoded = {path: (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n").encode("utf-8") for path, value in files.items()}
    size = sum(map(len, encoded.values()))
    if size > 6_000_000:
        raise RuntimeError(f"Recordings exceed 6 MB: {size} bytes; increase sky-series step.")
    for path, data in encoded.items():
        target = output / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    print(f"{len(places)} places, {len(files)} files, {size:,} bytes", flush=True)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--output", type=Path, default=ROOT / "data/examples/recorded")
    parser.add_argument("--recorded-utc")
    parser.add_argument("--main-sha", help="Commit of the server being recorded (default origin/main)")
    args = parser.parse_args()
    record(http_caller(args.base_url), args.output, recorded_utc=args.recorded_utc, main_sha=args.main_sha)


if __name__ == "__main__":
    main()
