"""``backend/scripts/run_validation.py`` with stubbed responses."""

import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "run_validation.py"
spec = importlib.util.spec_from_file_location("run_validation", SCRIPT)
rv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rv)


def _vector(**overrides):
    v = {
        "id": "X",
        "test": "T1",
        "title": "t",
        "endpoint": "/api/sky-series",
        "params": {"hours": 0},
        "measure": {"path": "samples.0.sun.elevation_deg", "kind": "number"},
        "expected": 2.47,
        "threshold": 0.01,
        "unit": "deg",
        "source": "s",
    }
    v.update(overrides)
    return v


def _const(status, body):
    return lambda endpoint, params: (status, body)


def _sky(el=2.475, az=65.66):
    return {"samples": [{"sun": {"elevation_deg": el, "azimuth_true_deg": az}}]}


def test_pass_and_fail():
    assert rv.evaluate(_vector(), _const(200, _sky(2.475)))["status"] == "pass"
    row = rv.evaluate(_vector(), _const(200, _sky(2.5)))
    assert row["status"] == "fail" and row["diff"] == pytest.approx(0.03)


def test_angle_difference_wraps():
    v = _vector(measure={"path": "samples.0.sun.azimuth_true_deg", "kind": "angle"}, expected=359.995)
    row = rv.evaluate(v, _const(200, _sky(az=0.004)))
    assert row["status"] == "pass" and row["diff"] == pytest.approx(0.009)


def test_missing_endpoint_is_skipped():
    row = rv.evaluate(_vector(endpoint="/api/events"), _const(404, {"detail": "Not Found"}))
    assert row["status"] == "skipped"


def test_api_404_is_a_failure():
    body = {"error": {"code": "site_not_found", "message": "x"}}
    row = rv.evaluate(_vector(), _const(404, body))
    assert row["status"] == "fail" and "site_not_found" in row["note"]


def test_reduce_and_transform():
    body = {"samples": [{"sun": {"elevation_deg": e}} for e in (1.0, 6.475, 3.0)]}
    v = _vector(measure={"path": "samples.*.sun.elevation_deg", "reduce": "max"}, expected=6.47)
    assert rv.evaluate(v, _const(200, body))["status"] == "pass"
    v = _vector(measure={"path": "horizon_deg.0", "transform": "negate"}, expected=0.087, threshold=0.001)
    assert rv.evaluate(v, _const(200, {"horizon_deg": [-0.0869]}))["status"] == "pass"


def test_event_time_with_warning_band():
    body = {"events": [{"type": "earthset", "utc": "2026-12-03T10:08:00Z"}]}
    v = _vector(
        measure={"event": {"type": "earthset", "index": 0}, "field": "utc", "kind": "utc"},
        expected="2026-12-03T10:03:00Z",
        threshold=2,
        warn_threshold=20,
        unit="min",
    )
    row = rv.evaluate(v, _const(200, body))
    assert row["status"] == "warn" and row["diff"] == pytest.approx(5.0)


def test_half_range_with_expected_range():
    body = {
        "events": [
            {"type": "sunrise", "utc": "2026-12-05T10:00:00Z",
             "utc_earliest": "2026-12-05T09:38:00Z", "utc_latest": "2026-12-05T10:22:00Z"}
        ]
    }
    v = _vector(
        measure={"event": {"type": "sunrise", "index": 0}, "field": "half_range_minutes"},
        expected=None, expected_range=[21.0, None], threshold=None, unit="min",
    )
    row = rv.evaluate(v, _const(200, body))
    assert row["status"] == "pass" and row["measured"] == pytest.approx(22.0)


def test_report_summary_and_exit_code(tmp_path):
    vectors = [_vector(id="a"), _vector(id="b", endpoint="/api/events")]

    def fetch(endpoint, params):
        return (200, _sky()) if endpoint == "/api/sky-series" else (404, None)

    report = rv.run(vectors, fetch)
    assert report["summary"] == {"pass": 1, "warn": 0, "fail": 0, "skipped": 1}
    for row in report["rows"]:
        for key in ("id", "title", "expected", "measured", "diff", "threshold", "unit", "status", "source"):
            assert key in row
