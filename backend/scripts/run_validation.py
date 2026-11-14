"""Run the reference test vectors against the API and write the validation report.

Reads ``data/examples/test_vectors.json`` (docs/PLAN.md, 4.2: T1, T2a, T2b,
T4, T5, T7), calls each endpoint and writes ``data/validation_report.json``.
Each row: id, test, title, expected, measured, diff, threshold, unit, status
(``pass``, ``warn``, ``fail`` or ``skipped``) and source.

A test whose endpoint does not exist yet (HTTP 404 without the API's error
body) is reported as ``skipped``; that alone does not make the run fail.
The exit code is 1 when any row is ``fail``.

Usage:
    python backend/scripts/run_validation.py                       # server on :8000
    python backend/scripts/run_validation.py --base-url http://127.0.0.1:8001
    python backend/scripts/run_validation.py --in-process          # no server needed
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
DEFAULT_VECTORS = REPO_ROOT / "data" / "examples" / "test_vectors.json"
DEFAULT_REPORT = REPO_ROOT / "data" / "validation_report.json"
DEFAULT_BASE_URL = "http://127.0.0.1:8000"

Fetch = Callable[[str, dict], tuple[int, Any]]
"""``fetch(endpoint, params) -> (status_code, json_body_or_None)``."""


class MeasureError(Exception):
    """The response does not contain the measured value."""


def http_fetcher(base_url: str, timeout_s: float = 120.0) -> Fetch:
    def fetch(endpoint: str, params: dict) -> tuple[int, Any]:
        query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
        url = f"{base_url.rstrip('/')}{endpoint}?{query}"
        try:
            with urllib.request.urlopen(url, timeout=timeout_s) as response:
                return response.status, _json_or_none(response.read())
        except urllib.error.HTTPError as exc:
            return exc.code, _json_or_none(exc.read())

    return fetch


def in_process_fetcher() -> Fetch:
    sys.path.insert(0, str(BACKEND_DIR))
    from fastapi.testclient import TestClient

    from app.main import create_app

    client = TestClient(create_app())

    def fetch(endpoint: str, params: dict) -> tuple[int, Any]:
        response = client.get(endpoint, params={k: v for k, v in params.items() if v is not None})
        return response.status_code, _json_or_none(response.content)

    return fetch


def _json_or_none(raw: bytes) -> Any:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def _parse_utc(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def _walk(body: Any, path: str) -> list[Any]:
    """Values at a dotted path; ``*`` expands a list, digits index it."""

    values = [body]
    for part in path.split("."):
        nxt: list[Any] = []
        for value in values:
            if part == "*":
                if not isinstance(value, list):
                    raise MeasureError(f"'{path}': expected a list at '*'")
                nxt.extend(value)
            elif isinstance(value, list) and part.isdigit():
                index = int(part)
                if index >= len(value):
                    raise MeasureError(f"'{path}': index {index} out of range")
                nxt.append(value[index])
            elif isinstance(value, dict) and part in value:
                nxt.append(value[part])
            else:
                raise MeasureError(f"'{path}': no '{part}' in response")
        values = nxt
    return values


def _find_event(body: Any, spec: dict) -> dict:
    events = body.get("events") if isinstance(body, dict) else None
    if not isinstance(events, list):
        raise MeasureError("response has no 'events' list")
    matches = [e for e in events if isinstance(e, dict) and e.get("type") == spec["type"]]
    index = int(spec.get("index", 0))
    if index >= len(matches):
        raise MeasureError(f"only {len(matches)} '{spec['type']}' event(s) in response")
    return matches[index]


def measure(body: Any, spec: dict) -> Any:
    """Extract the measured value described by ``spec`` from ``body``."""

    if "event" in spec:
        event = _find_event(body, spec["event"])
        field = spec["field"]
        if field == "half_range_minutes":
            early, late = event.get("utc_earliest"), event.get("utc_latest")
            if not early or not late:
                raise MeasureError("event has no utc_earliest or utc_latest")
            value: Any = (_parse_utc(late) - _parse_utc(early)).total_seconds() / 120.0
        else:
            if field not in event:
                raise MeasureError(f"event has no '{field}'")
            value = event[field]
    else:
        values = _walk(body, spec["path"])
        reduce = spec.get("reduce")
        if reduce is None:
            value = values[0]
        else:
            numbers = [float(v) for v in values if v is not None]
            if not numbers:
                raise MeasureError(f"'{spec['path']}': no values")
            value = max(numbers) if reduce == "max" else min(numbers)

    if value is None:
        raise MeasureError("measured value is null")
    transform = spec.get("transform")
    if transform == "negate":
        value = -float(value)
    elif transform == "one_minus":
        value = 1.0 - float(value)
    return value


def difference(measured: Any, expected: Any, kind: str) -> float:
    """``measured - expected``; minutes for UTC, wrapped degrees for angles."""

    if kind == "utc":
        return (_parse_utc(measured) - _parse_utc(expected)).total_seconds() / 60.0
    diff = float(measured) - float(expected)
    if kind == "angle":
        diff = (diff + 180.0) % 360.0 - 180.0
    return diff


def evaluate(vector: dict, fetch: Fetch) -> dict:
    row = {
        "id": vector["id"],
        "test": vector["test"],
        "title": vector["title"],
        "expected": vector.get("expected"),
        "measured": None,
        "diff": None,
        "threshold": vector.get("threshold"),
        "unit": vector["unit"],
        "status": "fail",
        "source": vector["source"],
        "endpoint": vector["endpoint"],
        "note": None,
    }
    if "expected_range" in vector:
        row["expected_range"] = vector["expected_range"]

    try:
        status, body = fetch(vector["endpoint"], vector["params"])
    except (urllib.error.URLError, OSError) as exc:
        row["note"] = f"request failed: {exc}"
        return row

    if status == 404 and not (isinstance(body, dict) and "error" in body):
        row["status"] = "skipped"
        row["note"] = f"endpoint {vector['endpoint']} is not available yet"
        return row
    if status != 200:
        error = body.get("error") if isinstance(body, dict) else None
        row["note"] = f"HTTP {status}" + (f": {error.get('code')}" if isinstance(error, dict) else "")
        return row

    spec = vector["measure"]
    try:
        measured = measure(body, spec)
    except (MeasureError, TypeError, ValueError) as exc:
        row["note"] = str(exc)
        return row

    kind = spec.get("kind", "number")
    row["measured"] = round(float(measured), 6) if kind != "utc" else measured

    if "expected_range" in vector:
        low, high = vector["expected_range"]
        value = float(measured)
        inside = (low is None or value >= low) and (high is None or value <= high)
        row["status"] = "pass" if inside else "fail"
        return row

    diff = difference(measured, vector["expected"], kind)
    row["diff"] = round(diff, 6)
    threshold = float(vector["threshold"])
    warn = vector.get("warn_threshold")
    if abs(diff) <= threshold + 1e-9:
        row["status"] = "pass"
    elif warn is not None and abs(diff) <= float(warn):
        row["status"] = "warn"
    else:
        row["status"] = "fail"
    return row


def run(vectors: list[dict], fetch: Fetch) -> dict:
    rows = [evaluate(vector, fetch) for vector in vectors]
    summary = {status: 0 for status in ("pass", "warn", "fail", "skipped")}
    for row in rows:
        summary[row["status"]] += 1
    return {
        "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "summary": summary,
        "rows": rows,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--in-process", action="store_true", help="call the app without a server")
    parser.add_argument("--vectors", type=Path, default=DEFAULT_VECTORS)
    parser.add_argument("--out", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args(argv)

    with open(args.vectors, encoding="utf-8") as f:
        vectors = json.load(f)["vectors"]
    fetch = in_process_fetcher() if args.in_process else http_fetcher(args.base_url)

    report = run(vectors, fetch)
    report["target"] = "in-process" if args.in_process else args.base_url
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write("\n")

    for row in report["rows"]:
        diff = "" if row["diff"] is None else f" diff {row['diff']:+.4f} {row['unit']}"
        note = f" ({row['note']})" if row["note"] else ""
        print(f"{row['status']:>7}  {row['id']}{diff}{note}")
    print(f"summary: {report['summary']} -> {args.out}")
    return 1 if report["summary"]["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())
