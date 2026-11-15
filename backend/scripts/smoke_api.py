"""Smoke test: call every API endpoint for every catalogue site and every candidate region.

Runs against a live server (default http://127.0.0.1:8000) or, with
``--in-process``, against the app without a server. Prints the status codes
per endpoint, every non-200 response and the slowest requests; exits with 1
when any response is not 200 (#104).

Usage:
    python backend/scripts/smoke_api.py
    python backend/scripts/smoke_api.py --base-url http://127.0.0.1:8000
    python backend/scripts/smoke_api.py --in-process
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Callable

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_BASE_URL = "http://127.0.0.1:8000"

START_UTC = "2026-12-01T00:00:00Z"
END_UTC = "2026-12-08T00:00:00Z"
NOW_UTC = "2026-12-05T00:00:00Z"
LAYERS = ("hillshade", "elevation", "slope", "psr")

Call = Callable[[str, str, dict | None, dict | None], tuple[int, bytes]]


def http_caller(base_url: str, timeout_s: float = 120.0) -> Call:
    def call(method: str, path: str, params: dict | None, body: dict | None) -> tuple[int, bytes]:
        query = urllib.parse.urlencode(params or {})
        url = f"{base_url.rstrip('/')}{path}" + (f"?{query}" if query else "")
        data = None if body is None else json.dumps(body).encode("utf-8")
        request = urllib.request.Request(url, data=data, method=method)
        if data is not None:
            request.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(request, timeout=timeout_s) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as exc:
            return exc.code, exc.read()

    return call


def in_process_caller() -> Call:
    sys.path.insert(0, str(BACKEND_DIR))
    from fastapi.testclient import TestClient

    from app.main import create_app

    client = TestClient(create_app())

    def call(method: str, path: str, params: dict | None, body: dict | None) -> tuple[int, bytes]:
        response = client.request(method, path, params=params, json=body)
        return response.status_code, response.content

    return call


def _json(raw: bytes) -> Any:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def plan(call: Call) -> list[tuple[str, str, str, dict | None, dict | None]]:
    """(label, method, path, params, body) for every request of the run."""

    requests: list[tuple[str, str, str, dict | None, dict | None]] = [
        ("health", "GET", "/api/health", None, None),
        ("sites", "GET", "/api/sites", None, None),
        ("panel-profiles", "GET", "/api/panel-profiles", None, None),
        ("reference-missions", "GET", "/api/reference-missions", None, None),
        ("validation", "GET", "/api/validation", None, None),
        ("candidates", "GET", "/api/candidates", None, None),
        ("body-series", "GET", "/api/body-series",
         {"start_utc": START_UTC, "end_utc": END_UTC, "step_s": 3600}, None),
    ]
    requests += [(f"layers/{n}", "GET", f"/api/layers/{n}", None, None) for n in LAYERS]

    status, raw = call("GET", "/api/sites", None, None)
    sites = _json(raw) if status == 200 else []
    status, raw = call("GET", "/api/candidates", None, None)
    cands = (_json(raw) or {}).get("candidates", []) if status == 200 else []
    status, raw = call("GET", "/api/panel-profiles", None, None)
    profiles = _json(raw) if status == 200 else []
    profile_id = profiles[0]["id"] if profiles else None

    ids = [s["id"] for s in sites or []] + [c["id"] for c in cands if c.get("kind") == "candidate"]
    for site_id in ids:
        loc = {"site_id": site_id, "mast_height_m": 2}
        span = {**loc, "start_utc": START_UTC, "end_utc": END_UTC}
        requests += [
            ("horizon", "GET", "/api/horizon", loc, None),
            ("sky-series", "GET", "/api/sky-series", {**loc, "start_utc": START_UTC, "hours": 24}, None),
            ("events", "GET", "/api/events", span, None),
            ("eclipses", "GET", "/api/eclipses", span, None),
            ("power", "GET", "/api/power", {**span, "panel_profile_id": profile_id}, None),
            ("now", "GET", "/api/now", {**loc, "utc": NOW_UTC}, None),
            ("comm-window", "GET", "/api/comm-window", {**loc, "utc": NOW_UTC}, None),
        ]
    if len(ids) >= 2 and profile_id:
        scenarios = [
            {"scenario_id": f"s{i}", "label": site_id, "site_id": site_id,
             "start_utc": START_UTC, "end_utc": END_UTC, "mast_height_m": 2,
             "panel_profile_id": profile_id}
            for i, site_id in enumerate([ids[0], ids[-1]])
        ]
        requests.append(("compare", "POST", "/api/compare", None, {"scenarios": scenarios}))
    return requests


def run(call: Call) -> dict:
    results = []
    for label, method, path, params, body in plan(call):
        t0 = time.perf_counter()
        try:
            status, raw = call(method, path, params, body)
            error = None
            if status != 200:
                payload = _json(raw)
                err = payload.get("error") if isinstance(payload, dict) else None
                error = err.get("code") if isinstance(err, dict) else raw[:120].decode("utf-8", "replace")
        except (urllib.error.URLError, OSError) as exc:
            status, error = 0, str(exc)
        results.append({
            "label": label, "method": method, "path": path, "params": params,
            "status": status, "error": error, "seconds": time.perf_counter() - t0,
        })
    return {"results": results, "failed": [r for r in results if r["status"] != 200]}


def report(outcome: dict) -> str:
    results = outcome["results"]
    by_label: dict[str, Counter] = defaultdict(Counter)
    for r in results:
        by_label[r["label"]][r["status"]] += 1
    lines = [f"{len(results)} requests, {len(outcome['failed'])} not 200", ""]
    for label, counts in by_label.items():
        codes = ", ".join(f"{code}: {n}" for code, n in sorted(counts.items()))
        lines.append(f"  {label:<20} {codes}")
    if outcome["failed"]:
        lines += ["", "Not 200:"]
        for r in outcome["failed"]:
            where = (r["params"] or {}).get("site_id", "")
            lines.append(f"  {r['status']} {r['method']} {r['path']} {where} {r['error'] or ''}".rstrip())
    lines += ["", "Slowest:"]
    for r in sorted(results, key=lambda r: -r["seconds"])[:5]:
        where = (r["params"] or {}).get("site_id", "")
        lines.append(f"  {r['seconds']:6.2f} s  {r['method']} {r['path']} {where}".rstrip())
    total = sum(r["seconds"] for r in results)
    lines.append(f"\ntotal {total:.1f} s")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--in-process", action="store_true", help="call the app without a server")
    args = parser.parse_args(argv)

    call = in_process_caller() if args.in_process else http_caller(args.base_url)
    outcome = run(call)
    print(report(outcome))
    return 1 if outcome["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
