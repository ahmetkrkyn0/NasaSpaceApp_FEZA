"""Run the reference tests and write the validation report.

Reads ``data/examples/test_vectors.json`` (docs/PLAN.md, 4.2: T1, T2a, T2b,
T4, T5, T7), calls each endpoint, adds the T3 rows (line A's unit test
computation, ``backend/tests/core/test_power.py``) and the T6 approximate
comparison, and writes ``data/validation_report.json`` (ADR-0004,
``/api/validation``). Each row: id, test, title, condition, kind, expected,
measured, diff, threshold, unit, status (``pass``, ``warn``, ``fail``,
``skipped`` or ``info``), source, endpoint and note.

T6 has no threshold: its row is ``kind: approximate`` with ``status: info``
and is never reported as validated (docs/PLAN.md, 4.1, rule 11). Its NASA
value is read with an HTTP range request from the PGDA 69 average solar
visibility map and cached under ``data/raw/validation/``.

A test whose endpoint does not exist yet (HTTP 404 without the API's error
body) is reported as ``skipped``. So is a test with a ``requires`` entry when
the endpoint answers but returns none of the events it needs (a feature of a
later issue, e.g. eclipses in #41); the note names that issue. Neither makes
the run fail. Without ``requires`` a missing event is a ``fail``.
The exit code is 1 when any row is ``fail``.

Usage:
    python backend/scripts/run_validation.py                       # server on :8000
    python backend/scripts/run_validation.py --base-url http://127.0.0.1:8001
    python backend/scripts/run_validation.py --in-process          # no server needed
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import math
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
DEFAULT_MARKDOWN = REPO_ROOT / "docs" / "validation-report.md"
DEFAULT_BASE_URL = "http://127.0.0.1:8000"
T6_CACHE = REPO_ROOT / "data" / "raw" / "validation" / "t6_avgvisib.json"
POWER_TEST = BACKEND_DIR / "tests" / "core" / "test_power.py"
SUB_POINTS_TEST = BACKEND_DIR / "tests" / "core" / "test_sub_points.py"
EARTH_SUB_POINTS_TEST = BACKEND_DIR / "tests" / "core" / "test_earth_sub_points.py"
CANDIDATES_SCRIPT = BACKEND_DIR / "scripts" / "make_candidates.py"

STATUSES = ("pass", "warn", "fail", "skipped", "info")
TEST_ORDER = ("T1", "T2a", "T2b", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12")

CONDITIONS = {
    "T1": "Six past landings at the landing instant; zero height, flat horizon (sphere)",
    "T2a": "Mons Mouton test site, 1 to 31 Dec 2026, 12 h step, zero height, flat horizon",
    "T2b": "Mons Mouton test site, 1 Dec 00:00 to 31 Dec 00:00 2026, Earth criterion centre, horizon 0 deg",
    "T3": (
        "Mons Mouton test site, 1 Dec 2026 00:00 to 1 Jan 2027 00:00, 745 hourly samples, 1 m2, "
        "no efficiency, vertical disk fraction with 0.267 deg Sun radius; "
        "horizon -1, 0 and +1 deg in every direction"
    ),
    "T4": "Flat horizon (sphere, R = 1737.4 km); observation height 1, 2, 5 and 10 m",
    "T5": "Apollo 11 site, 20 and 21 Feb 2027",
    "T6": (
        "Mons Mouton test site, calendar year 2027, 2 m mast, terrain horizon; "
        "NASA PGDA 69 average solar visibility map (120 m/px, 18.6-year average)"
    ),
    "T7": "Apollo 11 and Mons Mouton sites, first sunrise of Dec 2026; horizon moved by one arcminute",
    "T8": (
        "Sub-solar and sub-Earth points and Earth distance from GET /api/body-series at four "
        "instants (2025-03-06 to 2027-02-20), against JPL Horizons observer tables"
    ),
    "T9": (
        "Candidate regions of mons-mouton (data/candidates.json): limits of the selection and "
        "regeneration from the 20 m layers"
    ),
    "T10": (
        "Earth-fixed (IAU_EARTH) sub-lunar and sub-solar points from GET /api/body-series at four "
        "instants, against JPL Horizons (target Earth, observer Moon centre)"
    ),
    "T11": (
        "POST /api/recommend for mons-mouton, 1 to 15 Dec 2026, 2 m mast, the plan's default "
        "weights; again with a 3 deg slope limit and with the sunlit weight alone"
    ),
    "T12": (
        "Moon elevation at the three DSN stations against JPL Horizons; GET /api/earth-link at the "
        "Mons Mouton test site, 0 m mast, 1 to 31 Dec 2026, against the T2b Earth events"
    ),
}
"""Test conditions of docs/PLAN.md, 4.2; a vector may override with ``condition``."""

T3_SOURCE = "docs/research/dogrulama/gunes-paneli.md, No 4 and 6; docs/design/guc-degerlendirmesi.md, Test data"
T3_REL_THRESHOLD = 0.005
T3_DARK_THRESHOLD_H = 1.0

T6_SITE_ID = "mons-mouton-im2-target"
T6_MAST_HEIGHT_M = 2.0
T6_START = datetime(2027, 1, 1, tzinfo=timezone.utc)
T6_END = datetime(2028, 1, 1, tzinfo=timezone.utc)
T6_MAP_URL = "https://pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_75S_120M_201608.TIF"
T6_MAP_PRODUCT = "PGDA 69 AVGVISIB_75S_120M_201608"
T6_MAP_SCALE = 0.00004
"""``AVERAGE_VISIBILITY = DN * 0.00004`` (the product's PDS label)."""
T6_SOURCE = "docs/research/dogrulama/veri-kaynaklari.md, No 34; https://pgda.gsfc.nasa.gov/products/69"
T6_NOTE = (
    "Approximate comparison, not a validation: no threshold applies. 'Expected' holds the NASA map value "
    "(DN x 0.00004 from the product label) and 'measured' this product's value. Expected differences: the map is an "
    "18.6-year average and this run covers one year; the map averages the visible fraction of the solar "
    "disc, this run counts the time any part of the disc is above the horizon; the map cell is 120 m wide "
    "while this run uses one point with its own 20 m terrain horizon profile at a 2 m mast."
)

Fetch = Callable[[str, dict], tuple[int, Any]]
"""``fetch(endpoint, params) -> (status_code, json_body_or_None)``."""


class MeasureError(Exception):
    """The response does not contain the measured value."""


class FeatureMissing(MeasureError):
    """The endpoint exists but returns none of the events the test needs."""


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


def http_poster(base_url: str, timeout_s: float = 300.0) -> Callable[[str, dict], tuple[int, Any]]:
    def post(endpoint: str, body: dict) -> tuple[int, Any]:
        request = urllib.request.Request(
            f"{base_url.rstrip('/')}{endpoint}", data=json.dumps(body).encode("utf-8"), method="POST",
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout_s) as response:
                return response.status, _json_or_none(response.read())
        except urllib.error.HTTPError as exc:
            return exc.code, _json_or_none(exc.read())

    return post


def in_process_poster() -> Callable[[str, dict], tuple[int, Any]]:
    sys.path.insert(0, str(BACKEND_DIR))
    from fastapi.testclient import TestClient

    from app.main import create_app

    client = TestClient(create_app())

    def post(endpoint: str, body: dict) -> tuple[int, Any]:
        response = client.post(endpoint, json=body)
        return response.status_code, _json_or_none(response.content)

    return post


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
    if not matches:
        raise FeatureMissing(f"no '{spec['type']}' event in response")
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
        "condition": vector.get("condition") or CONDITIONS.get(vector["test"]),
        "kind": "reference",
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
    except FeatureMissing as exc:
        requires = vector.get("requires")
        if requires:
            row["status"] = "skipped"
            row["note"] = (
                f"{exc}; needs {requires['feature']}, not implemented yet ({requires['issue']})"
            )
        else:
            row["note"] = str(exc)
        return row
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


def _row(test: str, row_id: str, title: str, unit: str, source: str, **fields: Any) -> dict:
    row = {
        "id": row_id,
        "test": test,
        "title": title,
        "condition": CONDITIONS[test],
        "kind": "reference",
        "expected": None,
        "measured": None,
        "diff": None,
        "threshold": None,
        "unit": unit,
        "status": "fail",
        "source": source,
        "endpoint": None,
        "note": None,
    }
    row.update(fields)
    return row


def _ensure_backend_path() -> None:
    if str(BACKEND_DIR) not in sys.path:
        sys.path.insert(0, str(BACKEND_DIR))


def load_power_test() -> Any:
    """Line A's T3 unit test module: its reference table and ``_t3`` computation."""

    _ensure_backend_path()
    spec = importlib.util.spec_from_file_location("t3_power_test", POWER_TEST)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _fill(row: dict, compute: Callable[[], float]) -> None:
    try:
        measured = float(compute())
    except Exception as exc:  # noqa: BLE001 - a computation error is a failed row, not a crash
        row["note"] = f"{row['note']} Computation failed: {exc}"
        return
    diff = measured - float(row["expected"])
    row["measured"] = round(measured, 6)
    row["diff"] = round(diff, 6)
    row["status"] = "pass" if abs(diff) <= float(row["threshold"]) + 1e-9 else "fail"


def t3_rows(load: Callable[[], Any] = load_power_test) -> list[dict]:
    """T3 rows from the unit test's own computation (docs/PLAN.md, 4.2, T3 note)."""

    note = f"Computed by {POWER_TEST.relative_to(REPO_ROOT).as_posix()} (_t3), not by an endpoint."
    try:
        test = load()
    except Exception as exc:  # noqa: BLE001 - any import failure becomes a failed row
        return [_row("T3", "T3-power", "Panel power reference table", "W", T3_SOURCE,
                     note=f"T3 unit test could not be loaded: {exc}")]

    rows = []
    for panel_type, by_horizon in test.T3_MEAN_POWER.items():
        for horizon_deg, expected in by_horizon.items():
            row = _row(
                "T3", f"T3-{panel_type.replace('_', '-')}-h{horizon_deg:+g}",
                f"{panel_type} panel, horizon {horizon_deg:+g} deg: mean power per m2",
                "W", T3_SOURCE, expected=expected,
                threshold=round(expected * T3_REL_THRESHOLD, 4),
                note=f"{note} Threshold is 0.5 % of the expected value.",
            )
            _fill(row, lambda p=panel_type, h=horizon_deg: test._t3(p, h)["summary"]["mean_power_w"])
            rows.append(row)
    for horizon_deg, expected in test.T3_LONGEST_DARK_HOURS.items():
        row = _row(
            "T3", f"T3-longest-dark-h{horizon_deg:+g}",
            f"Longest dark period, horizon {horizon_deg:+g} deg",
            "h", T3_SOURCE, expected=expected, threshold=T3_DARK_THRESHOLD_H, note=note,
        )
        _fill(row, lambda h=horizon_deg: test._t3("vertical_tracking", h)["summary"]["longest_dark_hours"])
        rows.append(row)
    return rows


def read_nasa_avgvisib(cache: Path = T6_CACHE) -> dict:
    """PGDA 69 average solar visibility at the T6 site; cached after the first read."""

    if cache.is_file():
        with open(cache, encoding="utf-8") as f:
            return json.load(f)

    _ensure_backend_path()
    from app.core.catalog import find_site
    from app.terrain.dem import read_window
    from app.terrain.projection import latlon_to_xy

    site = find_site(T6_SITE_ID)
    x, y = latlon_to_xy(site["lat_deg"], site["lon_deg"])
    window = read_window(T6_MAP_URL, float(x), float(y), 60.0)
    rows, cols = window.data.shape
    dn = float(window.data[rows // 2, cols // 2])
    if not math.isfinite(dn):
        raise ValueError("the map cell at the T6 site is nodata")
    value = {
        "product": T6_MAP_PRODUCT,
        "url": T6_MAP_URL,
        "site_id": T6_SITE_ID,
        "lat_deg": site["lat_deg"],
        "lon_deg": site["lon_deg"],
        "dn": dn,
        "scaling_factor": T6_MAP_SCALE,
        "average_visibility": dn * T6_MAP_SCALE,
        "resolution_m": window.resolution_m,
    }
    cache.parent.mkdir(parents=True, exist_ok=True)
    with open(cache, "w", encoding="utf-8", newline="\n") as f:
        json.dump(value, f, indent=2)
        f.write("\n")
    return value


def compute_t6_sunlit_fraction() -> dict:
    """One-year sunlit fraction at the T6 site with the terrain horizon (product computation)."""

    _ensure_backend_path()
    from app.core.events import compute_events, observer_for
    from app.core.location import resolve

    observer = observer_for(resolve(T6_SITE_ID, None, None), T6_MAST_HEIGHT_M)
    result = compute_events(observer, T6_START, T6_END)
    return {
        "sunlit_fraction": result["metrics"]["sunlit_fraction"],
        "horizon_method": observer.profile.method,
        "validity": result["validity"],
    }


def t6_row(
    nasa: Callable[[], dict] = read_nasa_avgvisib,
    ours: Callable[[], dict] = compute_t6_sunlit_fraction,
) -> dict:
    """T6: approximate comparison with the NASA map; ``info``, never ``pass``."""

    row = _row(
        "T6", "T6-mons-mouton-sunlit-fraction",
        "Mons Mouton test site: one-year sunlit time fraction next to the NASA average solar visibility map",
        "%", T6_SOURCE, kind="approximate", note=T6_NOTE,
    )
    try:
        reference = nasa()
    except Exception as exc:  # noqa: BLE001 - network or GDAL failure
        row["status"] = "skipped"
        row["note"] = f"NASA map value not available: {exc}"
        return row
    row["expected"] = round(100.0 * float(reference["average_visibility"]), 3)
    try:
        measured = ours()
    except Exception as exc:  # noqa: BLE001 - e.g. kernels missing
        row["note"] = f"{T6_NOTE} Computation failed: {exc}"
        return row
    if measured["horizon_method"] != "terrain":
        row["note"] = f"{T6_NOTE} Terrain horizon not available (got {measured['horizon_method']})."
        return row
    value = 100.0 * float(measured["sunlit_fraction"])
    row["measured"] = round(value, 3)
    row["diff"] = round(value - row["expected"], 3)
    row["status"] = "info"
    return row


# ---------- T8: sub-points against JPL Horizons (#98, #104) ----------

T8_SOURCE = "backend/tests/core/test_sub_points.py (JPL Horizons, queried 15 Nov 2026)"
AU_KM = 149_597_870.7


def load_sub_points_test() -> Any:
    """The #98 reference test module: ``HORIZONS_CASES`` and the tolerances."""

    _ensure_backend_path()
    spec = importlib.util.spec_from_file_location("t8_sub_points_test", SUB_POINTS_TEST)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def t8_rows(fetch: Fetch, load: Callable[[], Any] = load_sub_points_test) -> list[dict]:
    """One row per quantity and instant, measured through ``/api/body-series``.

    Expected values and tolerances are the reference test's own (0.01 deg per
    angle, 1 km for the distance); the reason for each is in that module."""

    try:
        test = load()
    except Exception as exc:  # noqa: BLE001
        return [_row("T8", "T8-sub-points", "Sub-solar and sub-Earth points", "deg", T8_SOURCE,
                     note=f"Reference test could not be loaded: {exc}")]
    quantities = (
        ("sub-earth-lon", "sub_earth_lon_deg", 1, "deg", test.ANGLE_TOL_DEG, "angle"),
        ("sub-earth-lat", "sub_earth_lat_deg", 2, "deg", test.ANGLE_TOL_DEG, "number"),
        ("sub-solar-lon", "sub_solar_lon_deg", 3, "deg", test.ANGLE_TOL_DEG, "angle"),
        ("sub-solar-lat", "sub_solar_lat_deg", 4, "deg", test.ANGLE_TOL_DEG, "number"),
        ("earth-distance", "earth_distance_km", 5, "km", test.DISTANCE_TOL_KM, "number"),
    )
    lon_note = "Horizons longitudes run 0 to 360 east; the difference is wrapped to (-180, 180]."
    rows = []
    for case in test.HORIZONS_CASES:
        utc = case[0]
        status, body = fetch("/api/body-series", {"utc": utc})
        for slug, field, index, unit, tol, kind in quantities:
            expected = case[index] * AU_KM if slug == "earth-distance" else case[index]
            row = _row(
                "T8", f"T8-{utc[:10]}-{slug}", f"{utc}: {field}", unit, T8_SOURCE,
                expected=round(expected, 6), threshold=tol, endpoint="/api/body-series",
                note=lon_note if kind == "angle" else None,
            )
            if status != 200:
                row["note"] = f"HTTP {status}"
                if status == 404:
                    row["status"] = "skipped"
                rows.append(row)
                continue
            try:
                measured = float(body["samples"][0][field])
            except (KeyError, IndexError, TypeError, ValueError) as exc:
                row["note"] = f"no {field} in response: {exc}"
                rows.append(row)
                continue
            diff = difference(measured, expected, kind)
            row["measured"] = round(measured, 6)
            row["diff"] = round(diff, 6)
            row["status"] = "pass" if abs(diff) <= tol + 1e-9 else "fail"
            rows.append(row)
    return rows


# ---------- T10: Earth-fixed sub-points against JPL Horizons (#122) ----------

T10_SOURCE = "backend/tests/core/test_earth_sub_points.py (JPL Horizons, queried 15 Nov 2026)"
T10_NOTE = (
    "IAU_EARTH rotation model (no nutation, no UT1): longitudes within 0.1 deg as for the #99 "
    "station elevations. Horizons latitudes are planetodetic; the expected value is converted "
    "to planetocentric."
)


def load_earth_sub_points_test() -> Any:
    _ensure_backend_path()
    spec = importlib.util.spec_from_file_location("t10_earth_sub_points_test", EARTH_SUB_POINTS_TEST)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def t10_rows(fetch: Fetch, load: Callable[[], Any] = load_earth_sub_points_test) -> list[dict]:
    """One row per quantity and instant, measured through ``/api/body-series``."""

    try:
        test = load()
    except Exception as exc:  # noqa: BLE001
        return [_row("T10", "T10-earth-sub-points", "Earth-fixed sub-points", "deg", T10_SOURCE,
                     note=f"Reference test could not be loaded: {exc}")]
    quantities = (
        ("sub-lunar-lon", "earth_sub_lunar_lon_deg", 1, test.TOL_DEG, "angle"),
        ("sub-lunar-lat", "earth_sub_lunar_lat_deg", 2, test.LAT_TOL_DEG, "lat"),
        ("sub-solar-lon", "earth_sub_solar_lon_deg", 3, test.TOL_DEG, "angle"),
        ("sub-solar-lat", "earth_sub_solar_lat_deg", 4, test.LAT_TOL_DEG, "lat"),
    )
    rows = []
    for case in test.HORIZONS_CASES:
        utc = case[0]
        status, body = fetch("/api/body-series", {"utc": utc})
        for slug, field, index, tol, kind in quantities:
            expected = test.planetocentric(case[index]) if kind == "lat" else case[index]
            row = _row(
                "T10", f"T10-{utc[:10]}-{slug}", f"{utc}: {field}", "deg", T10_SOURCE,
                expected=round(expected, 6), threshold=tol, endpoint="/api/body-series",
                note=T10_NOTE,
            )
            if status != 200:
                row["note"] = f"HTTP {status}"
                if status == 404:
                    row["status"] = "skipped"
                rows.append(row)
                continue
            try:
                measured = float(body["samples"][0][field])
            except (KeyError, IndexError, TypeError, ValueError) as exc:
                row["note"] = f"no {field} in response: {exc}"
                rows.append(row)
                continue
            diff = difference(measured, expected, "angle" if kind == "angle" else "number")
            row["measured"] = round(measured, 6)
            row["diff"] = round(diff, 6)
            row["status"] = "pass" if abs(diff) <= tol + 1e-9 else "fail"
            rows.append(row)
    return rows


# ---------- T11: recommendation consistency (#100, #104) ----------

T11_SOURCE = "docs/design/saha-puani.md, 4 (score); #100 (POST /api/recommend)"
T11_REQUEST = {
    "region": "mons-mouton",
    "start_utc": "2026-12-01T00:00:00Z",
    "end_utc": "2026-12-15T00:00:00Z",
    "mast_height_m": 2,
    "weights": {"sunlit": 1.0, "dark": 1.0, "earth": 1.0, "slope": 1.0, "roughness": 0.5,
                "psr_distance": 0.0},
    "limits": {"max_slope_deg": 12.0},
    "psr_preference": "far",
    "include_catalogue_sites": True,
}
T11_TIGHT_SLOPE_DEG = 3.0
"""A limit below some sites' steepest slope, so the elimination rule is exercised."""


def _count_row(row_id: str, title: str, value: float, high: float = 0.0, note: str | None = None,
               unit: str = "count") -> dict:
    row = _row("T11", row_id, title, unit, T11_SOURCE, endpoint="/api/recommend",
               expected_range=[0, high], note=note)
    row["measured"] = round(float(value), 6)
    row["status"] = "pass" if 0 <= value <= high + 1e-9 else "fail"
    return row


def _order_violations(ranked: list[dict]) -> int:
    """Scored sites must come first, by score from highest; eliminated sites last."""

    bad, seen_dropped, last = 0, False, float("inf")
    for site in ranked:
        if site["eliminated"]:
            seen_dropped = True
            bad += site["score"] is not None
            continue
        bad += seen_dropped or site["score"] is None or site["score"] > last + 1e-9
        last = site["score"] if site["score"] is not None else last
    return bad


def t11_rows(fetch: Fetch, post: Callable[[str, dict], tuple[int, Any]] | None) -> list[dict]:
    """Checks on the recommendation answer that do not repeat its code."""

    def failed(note: str, status: str = "fail") -> list[dict]:
        row = _row("T11", "T11-recommend", "Recommendation", "1", T11_SOURCE,
                   endpoint="/api/recommend", note=note)
        row["status"] = status
        return [row]

    if post is None:
        return failed("No POST client for this run.", "skipped")
    status, body = post("/api/recommend", T11_REQUEST)
    if status == 404 and not (isinstance(body, dict) and "error" in body):
        return failed("endpoint /api/recommend is not available yet", "skipped")
    if status != 200:
        return failed(f"HTTP {status}")
    tight_status, tight = post("/api/recommend", {**T11_REQUEST,
                                                  "limits": {"max_slope_deg": T11_TIGHT_SLOPE_DEG}})
    cstatus, cands = fetch("/api/candidates", {"region": T11_REQUEST["region"]})
    if tight_status != 200 or cstatus != 200:
        return failed(f"HTTP {tight_status} (tight limit) / {cstatus} (candidates)")
    max_slope = {e["id"]: e["max_slope_deg"] for e in cands["candidates"]}

    rows = []
    worst = 0.0
    for site in body["ranked"]:
        if site["score"] is None:
            continue
        parts = site["components"]
        total = sum(p["weight"] for p in parts)
        again = 100.0 * sum(p["weight"] * (p["normalized"] or 0.0) for p in parts) / total
        worst = max(worst, abs(round(again, 1) - site["score"]))
    rows.append(_count_row(
        "T11-score-recomputed", "Largest difference between a score and its components' weighted mean",
        worst, 0.05, note="Score = 100 x sum(weight x normalized) / sum(weight), rounded to 0.1.",
        unit="points"))

    def wrong_elimination(answer: dict, limit: float) -> int:
        return sum(
            1 for s in answer["ranked"]
            if s["eliminated"] != (max_slope.get(s["site_id"]) is None or max_slope[s["site_id"]] > limit)
            or (s["eliminated"] != (s["score"] is None))
        )

    eliminated_tight = sum(1 for s in tight["ranked"] if s["eliminated"])
    rows.append(_count_row(
        "T11-elimination", "Sites whose elimination disagrees with their steepest slope (12 and "
        f"{T11_TIGHT_SLOPE_DEG:g} deg limits)",
        wrong_elimination(body, 12.0) + wrong_elimination(tight, T11_TIGHT_SLOPE_DEG),
        note=f"The {T11_TIGHT_SLOPE_DEG:g} deg limit eliminates {eliminated_tight} of "
             f"{len(tight['ranked'])} sites; max_slope_deg from /api/candidates.",
    ))
    rows.append(_count_row(
        "T11-order", "Ranking order violations (score descending, eliminated sites last)",
        _order_violations(body["ranked"]) + _order_violations(tight["ranked"]),
    ))

    sstatus, single = post("/api/recommend", {**T11_REQUEST, "weights": {
        "sunlit": 1.0, "dark": 0.0, "earth": 0.0, "slope": 0.0, "roughness": 0.0, "psr_distance": 0.0}})
    if sstatus == 200:
        values = [next(p["value"] for p in s["components"] if p["metric"] == "sunlit_fraction")
                  for s in single["ranked"] if not s["eliminated"]]
        rows.append(_count_row(
            "T11-single-weight", "With only the sunlit weight, sites out of sunlit-fraction order",
            sum(1 for a, b in zip(values, values[1:]) if b > a + 1e-9),
        ))

    first = next((s for s in body["ranked"] if not s["eliminated"]), None)
    if first is not None:
        estatus, ev = fetch("/api/events", {
            "site_id": first["site_id"], "mast_height_m": T11_REQUEST["mast_height_m"],
            "start_utc": T11_REQUEST["start_utc"], "end_utc": T11_REQUEST["end_utc"],
            "earth_criterion": "center",
        })
        row = _row("T11", "T11-events-agree", f"{first['site_id']}: sunlit fraction, recommend against /api/events",
                   "1", T11_SOURCE, endpoint="/api/recommend", threshold=0.0001,
                   note="Same site, period, mast height and Earth criterion (centre).")
        if estatus == 200:
            expected = float(ev["metrics"]["sunlit_fraction"])
            measured = next(p["value"] for p in first["components"] if p["metric"] == "sunlit_fraction")
            row["expected"] = round(expected, 6)
            row["measured"] = round(float(measured), 6)
            row["diff"] = round(float(measured) - expected, 6)
            row["status"] = "pass" if abs(row["diff"]) <= 0.0001 + 1e-9 else "fail"
        else:
            row["note"] = f"/api/events HTTP {estatus}"
        rows.append(row)
    return rows


# ---------- T12: Earth link (#99, #104) ----------

STATIONS_TEST = BACKEND_DIR / "tests" / "core" / "test_stations.py"
T12_STATION_SOURCE = "backend/tests/core/test_stations.py (JPL Horizons, queried 15 Nov 2026)"
T12_PARAMS = {
    "site_id": "mons-mouton-im2-target", "mast_height_m": 0,
    "start_utc": "2026-12-01T00:00:00Z", "end_utc": "2026-12-31T00:00:00Z",
    "earth_criterion": "center",
}


def load_stations_test() -> Any:
    _ensure_backend_path()
    spec = importlib.util.spec_from_file_location("t12_stations_test", STATIONS_TEST)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def t12_station_rows(load: Callable[[], Any] = load_stations_test) -> list[dict]:
    """Moon elevation at each DSN station against Horizons (the #99 reference test's own cases)."""

    note = (f"Computed by {STATIONS_TEST.relative_to(REPO_ROOT).as_posix()} cases with "
            "ephemeris.moon_elevations_from_earth; IAU_EARTH rotation model, no refraction.")
    try:
        test = load()
    except Exception as exc:  # noqa: BLE001
        return [_row("T12", "T12-station-elevation", "Moon elevation at the DSN stations", "deg",
                     T12_STATION_SOURCE, note=f"Reference test could not be loaded: {exc}")]
    from app.core import ephemeris

    rows = []
    for station_id, utc, expected in test.HORIZONS_CASES:
        row = _row("T12", f"T12-{station_id}-{utc[:13]}", f"{station_id}, {utc}: Moon elevation",
                   "deg", T12_STATION_SOURCE, expected=expected,
                   threshold=test.ELEVATION_TOL_DEG, note=note)

        def compute(sid=station_id, t=utc):
            s = test._station(sid)
            (value,) = ephemeris.moon_elevations_from_earth(
                s.lat_deg, s.lon_deg, s.elevation_m, [_parse_utc(t)])
            return value

        _fill(row, compute)
        rows.append(row)
    return rows


def t12_link_rows(fetch: Fetch, vectors: list[dict]) -> list[dict]:
    """Earth-link edges at the Mons Mouton test site against the T2b reference events.

    At a 0 m mast the site loses the Earth exactly when T2b's earthset happens,
    so ``relay_needed`` must start at each earthset and end at the earthrise;
    thresholds are T2b's own."""

    by_id = {v["id"]: v for v in vectors}
    status, body = fetch("/api/earth-link", T12_PARAMS)
    specs = [("T12-relay-start-1", "T2b-earthset-1", "start_utc", 0),
             ("T12-relay-end-1", "T2b-earthrise-1", "end_utc", 0),
             ("T12-relay-start-2", "T2b-earthset-2", "start_utc", 1)]
    rows = []
    relays = [] if status != 200 else [w for w in body["link_windows"] if w["mode"] == "relay_needed"]
    for row_id, ref_id, field, index in specs:
        ref = by_id.get(ref_id)
        if ref is None:
            continue
        row = _row("T12", row_id, f"Mons Mouton test site: relay_needed {field} #{index + 1} "
                   f"against {ref_id}", "min", ref["source"], expected=ref["expected"],
                   threshold=ref["threshold"], endpoint="/api/earth-link",
                   note="0 m mast, Earth criterion centre, 1 to 31 Dec 2026.")
        if status != 200:
            row["note"] = f"HTTP {status}"
            row["status"] = "skipped" if status == 404 else "fail"
        elif index >= len(relays):
            row["note"] = f"only {len(relays)} relay_needed window(s)"
        else:
            measured = relays[index][field]
            diff = difference(measured, ref["expected"], "utc")
            row["measured"] = measured
            row["diff"] = round(diff, 6)
            warn = ref.get("warn_threshold")
            if abs(diff) <= float(ref["threshold"]) + 1e-9:
                row["status"] = "pass"
            elif warn is not None and abs(diff) <= float(warn):
                row["status"] = "warn"
            else:
                row["status"] = "fail"
        rows.append(row)

    ref = by_id.get("T2b-earth-hidden-fraction")
    if ref is not None:
        row = _row("T12", "T12-relay-fraction", "Mons Mouton test site: share of time relay_needed "
                   "against the T2b Earth-hidden fraction", "1", ref["source"],
                   expected=ref["expected"], threshold=ref["threshold"], endpoint="/api/earth-link")
        if status == 200:
            start, end = _parse_utc(T12_PARAMS["start_utc"]), _parse_utc(T12_PARAMS["end_utc"])
            hidden = sum((_parse_utc(w["end_utc"]) - _parse_utc(w["start_utc"])).total_seconds()
                         for w in relays)
            value = hidden / (end - start).total_seconds()
            row["measured"] = round(value, 6)
            row["diff"] = round(value - float(ref["expected"]), 6)
            row["status"] = "pass" if abs(row["diff"]) <= float(ref["threshold"]) + 1e-9 else "fail"
        else:
            row["note"] = f"HTTP {status}"
        rows.append(row)
    return rows


# ---------- T9: candidate regions (#103, #104) ----------

T9_SOURCE = "docs/research/dogrulama/gorev-araclari.md, No 89 (slope limit); #103 (method)"


def load_candidates_script() -> Any:
    _ensure_backend_path()
    scripts = str(CANDIDATES_SCRIPT.parent)
    if scripts not in sys.path:
        sys.path.insert(0, scripts)
    spec = importlib.util.spec_from_file_location("t9_make_candidates", CANDIDATES_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _ranged(row_id: str, title: str, unit: str, value: float, low: float | None,
            high: float | None, note: str | None = None) -> dict:
    row = _row("T9", row_id, title, unit, T9_SOURCE, endpoint="/api/candidates",
               expected_range=[low, high], note=note)
    row["measured"] = round(float(value), 6)
    inside = (low is None or value >= low - 1e-9) and (high is None or value <= high + 1e-9)
    row["status"] = "pass" if inside else "fail"
    return row


def t9_rows(data_dir: Path = REPO_ROOT / "data",
            load_script: Callable[[], Any] = load_candidates_script) -> list[dict]:
    """Limits of every stored candidate region and regeneration of the file."""

    _ensure_backend_path()
    try:
        from app.terrain import candidates as cd
        from app.terrain.layers import bundled_layers_dir, layer_exists, layers_dir, load_layer

        stored = cd.load_candidates(data_dir)
    except Exception as exc:  # noqa: BLE001
        return [_row("T9", "T9-candidates", "Candidate regions", "1", T9_SOURCE,
                     note=f"data/candidates.json could not be read: {exc}")]
    cands = [e for e in stored["candidates"] if e.get("kind") == "candidate"]
    limit = float(stored["method"]["slope_limit_deg"])
    sep_km = float(stored["method"]["min_separation_km"])
    rows = [_ranged("T9-max-mean-slope", "Largest mean slope of a candidate region", "deg",
                    max(e["mean_slope_deg"] for e in cands), None, limit)]

    raw = layers_dir(data_dir)
    full = layer_exists(raw, stored["region"], "psr")
    psr = load_layer(raw if full else bundled_layers_dir(data_dir), stored["region"], "psr")
    grid = cd.Grid(psr.values, psr.values, psr.values, psr.meta.x_min, psr.meta.y_max,
                   psr.meta.resolution_m)
    shadowed = sum(1 for e in cands if psr.values[grid.xy_cell(*cd.site_xy(e))] >= 0.5)
    rows.append(_ranged(
        "T9-centres-in-shadow", "Candidate region centres in permanent shadow", "count",
        shadowed, 0, 0,
        note=None if full else "Checked on the bundled 40 m psr layer (cell fraction >= 0.5).",
    ))

    xy = [cd.site_xy(e) for e in cands]
    closest = min(
        (((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 / 1000.0
         for i, a in enumerate(xy) for b in xy[i + 1:]),
        default=float("inf"),
    )
    rows.append(_ranged("T9-min-separation", "Closest pair of candidate regions", "km",
                        closest, sep_km - 0.001, None,
                        note="Coordinates are rounded to 1e-5 deg (about 1 m)."))

    row = _row("T9", "T9-regenerated", "data/candidates.json regenerated from the 20 m layers",
               "fields", T9_SOURCE, expected=0, threshold=0.5,
               note="Count of fields that differ after make_candidates.build().")
    if not full:
        row["status"] = "skipped"
        row["note"] = "Full resolution layers not built (python backend/scripts/make_layers.py)."
    else:
        try:
            fresh = load_script().build(data_dir, stored["region"])
            diffs = abs(len(fresh["candidates"]) - len(stored["candidates"]))
            diffs += sum(1 for a, b in zip(fresh["candidates"], stored["candidates"])
                         for k in set(a) | set(b) if a.get(k) != b.get(k))
            diffs += sum(1 for k in set(fresh["method"]) | set(stored["method"])
                         if fresh["method"].get(k) != stored["method"].get(k))
            row["measured"] = diffs
            row["diff"] = diffs
            row["status"] = "pass" if diffs == 0 else "fail"
        except Exception as exc:  # noqa: BLE001
            row["note"] = f"Regeneration failed: {exc}"
    rows.append(row)
    return rows


def run(vectors: list[dict], fetch: Fetch, extra_rows: list[dict] | None = None) -> dict:
    rows = [evaluate(vector, fetch) for vector in vectors] + list(extra_rows or [])
    order = {test: i for i, test in enumerate(TEST_ORDER)}
    rows.sort(key=lambda row: order.get(row["test"], len(order)))
    summary = {status: 0 for status in STATUSES}
    for row in rows:
        summary[row["status"]] += 1
    return {
        "generated_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "summary": summary,
        "rows": rows,
    }


TEST_HEADINGS = {
    "T1": "T1: Sun and Earth angles at six past landings",
    "T2a": "T2a: Mons Mouton test site, one month of Sun and Earth elevation",
    "T2b": "T2b: Mons Mouton test site, Earth set and rise",
    "T3": "T3: Panel power",
    "T4": "T4: Flat horizon dip",
    "T5": "T5: An eclipse at the Apollo 11 site",
    "T6": "T6: Comparison with the NASA average illumination map (approximate)",
    "T7": "T7: Event time sensitivity to the horizon",
    "T8": "T8: Sub-solar and sub-Earth points (JPL Horizons)",
    "T9": "T9: Candidate regions",
    "T10": "T10: Points below the Moon and the Sun on the Earth (JPL Horizons)",
    "T11": "T11: Recommendation consistency",
    "T12": "T12: Earth link (DSN station elevation and link edges)",
}


def _cell(value: Any) -> str:
    if value is None:
        return "–"
    if isinstance(value, list):
        return " to ".join(_cell(v) for v in value)
    if isinstance(value, float):
        return f"{value:g}"
    return str(value).replace("|", "\\|")


def render_markdown(report: dict) -> str:
    """The report as English Markdown: one table per test, every row shown."""

    summary = report["summary"]
    lines = [
        "# Validation report",
        "",
        "<!-- Generated by backend/scripts/run_validation.py; do not edit by hand. -->",
        "",
        f"- **Generated (UTC):** {report['generated_utc']}",
        f"- **Target:** {report.get('target', '–')}",
        "- **Summary:** " + ", ".join(f"{summary[s]} {s}" for s in STATUSES),
        "- **Machine-readable:** [`data/validation_report.json`](../data/validation_report.json), "
        "served as `GET /api/validation`",
        "",
        "Every reference test of [docs/PLAN.md, 4.2](PLAN.md#42-referans-testler) is listed; failed rows "
        "are not hidden. Expected values are verified rows of the `docs/research/dogrulama/` tables. "
        "`diff` is measured minus expected. Status `info` marks the approximate comparison (T6): it has no "
        "threshold and is not a validation.",
        "",
    ]
    for test in TEST_ORDER:
        rows = [row for row in report["rows"] if row["test"] == test]
        if not rows:
            continue
        conditions = sorted({row["condition"] for row in rows if row.get("condition")})
        lines += [f"## {TEST_HEADINGS.get(test, test)}", ""]
        lines += [f"**Condition:** {c}" for c in conditions] + [""]
        lines += [
            "| Row | Expected | Measured | Diff | Threshold | Unit | Status | Source |",
            "|---|---:|---:|---:|---:|---|---|---|",
        ]
        notes = []
        for row in rows:
            expected = row.get("expected_range") if row.get("expected") is None else row["expected"]
            lines.append(
                f"| {_cell(row['title'])} | {_cell(expected)} | {_cell(row['measured'])} | "
                f"{_cell(row['diff'])} | {_cell(row['threshold'])} | {row['unit']} | "
                f"**{row['status']}** | {_cell(row['source'])} |"
            )
            if row.get("note"):
                notes.append(row["note"])
        unique_notes = list(dict.fromkeys(notes))
        if unique_notes:
            lines += [""] + [f"- {note}" for note in unique_notes]
        lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--in-process", action="store_true", help="call the app without a server")
    parser.add_argument("--vectors", type=Path, default=DEFAULT_VECTORS)
    parser.add_argument("--out", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--no-t3", action="store_true", help="leave out the T3 unit test rows")
    parser.add_argument("--no-t6", action="store_true", help="leave out the T6 approximate comparison")
    parser.add_argument(
        "--markdown", type=Path, default=DEFAULT_MARKDOWN,
        help="also write the report as Markdown (default docs/validation-report.md)",
    )
    args = parser.parse_args(argv)

    with open(args.vectors, encoding="utf-8") as f:
        vectors = json.load(f)["vectors"]
    fetch = in_process_fetcher() if args.in_process else http_fetcher(args.base_url)

    extra = [] if args.no_t3 else t3_rows()
    if not args.no_t6:
        extra.append(t6_row())
    extra += t8_rows(fetch)
    extra += t9_rows()
    extra += t10_rows(fetch)
    extra += t11_rows(fetch, in_process_poster() if args.in_process else http_poster(args.base_url))
    extra += t12_station_rows()
    extra += t12_link_rows(fetch, vectors)
    report = run(vectors, fetch, extra)
    report["target"] = "in-process" if args.in_process else args.base_url
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write("\n")
    if args.markdown is not None:
        args.markdown.parent.mkdir(parents=True, exist_ok=True)
        with open(args.markdown, "w", encoding="utf-8", newline="\n") as f:
            f.write(render_markdown(report))

    for row in report["rows"]:
        diff = "" if row["diff"] is None else f" diff {row['diff']:+.4f} {row['unit']}"
        note = f" ({row['note']})" if row["note"] else ""
        print(f"{row['status']:>7}  {row['id']}{diff}{note}")
    print(f"summary: {report['summary']} -> {args.out}")
    return 1 if report["summary"]["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())
