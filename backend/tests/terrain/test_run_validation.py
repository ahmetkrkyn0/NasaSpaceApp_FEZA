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
    assert report["summary"] == {"pass": 1, "warn": 0, "fail": 0, "skipped": 1, "info": 0}
    for row in report["rows"]:
        for key in ("id", "title", "condition", "kind", "expected", "measured", "diff",
                    "threshold", "unit", "status", "source"):
            assert key in row
        assert row["kind"] == "reference"


def test_condition_comes_from_the_plan_or_the_vector():
    assert rv.evaluate(_vector(), _const(200, _sky()))["condition"] == rv.CONDITIONS["T1"]
    row = rv.evaluate(_vector(condition="custom"), _const(200, _sky()))
    assert row["condition"] == "custom"


class _FakePowerTest:
    T3_MEAN_POWER = {"two_axis": {0.0: 771.2}, "horizontal": {0.0: 54.3}}
    T3_LONGEST_DARK_HOURS = {0.0: 280.0}

    @staticmethod
    def _t3(panel_type, horizon_deg):
        mean = {"two_axis": 771.5, "horizontal": 60.0}.get(panel_type, 0.0)
        return {"summary": {"mean_power_w": mean, "longest_dark_hours": 280.4}}


def test_t3_rows_use_the_unit_test_computation():
    rows = {row["id"]: row for row in rv.t3_rows(lambda: _FakePowerTest)}
    assert rows["T3-two-axis-h+0"]["status"] == "pass"
    assert rows["T3-two-axis-h+0"]["threshold"] == pytest.approx(3.856)
    assert rows["T3-horizontal-h+0"]["status"] == "fail"
    assert rows["T3-longest-dark-h+0"]["status"] == "pass"
    for row in rows.values():
        assert row["endpoint"] is None and row["test"] == "T3"


def test_t3_import_failure_is_a_failed_row():
    def broken():
        raise ImportError("no module")

    (row,) = rv.t3_rows(broken)
    assert row["status"] == "fail" and "no module" in row["note"]


def _nasa():
    return {"average_visibility": 0.4646}


def test_t6_is_info_with_difference_and_no_threshold():
    row = rv.t6_row(_nasa, lambda: {"sunlit_fraction": 0.4498, "horizon_method": "terrain"})
    assert row["kind"] == "approximate" and row["status"] == "info"
    assert row["threshold"] is None
    assert row["expected"] == pytest.approx(46.46)
    assert row["diff"] == pytest.approx(-1.48)


def test_t6_without_terrain_horizon_fails():
    row = rv.t6_row(_nasa, lambda: {"sunlit_fraction": 0.5, "horizon_method": "sphere"})
    assert row["status"] == "fail"


def test_t6_without_nasa_value_is_skipped():
    def offline():
        raise OSError("network down")

    row = rv.t6_row(offline, lambda: {"sunlit_fraction": 0.5, "horizon_method": "terrain"})
    assert row["status"] == "skipped" and "network down" in row["note"]


def test_rows_are_ordered_by_test_and_info_is_counted():
    t6 = rv.t6_row(_nasa, lambda: {"sunlit_fraction": 0.45, "horizon_method": "terrain"})
    report = rv.run([_vector(id="a", test="T7"), _vector(id="b")], _const(200, _sky()), [t6])
    assert [row["test"] for row in report["rows"]] == ["T1", "T6", "T7"]
    assert report["summary"]["info"] == 1


def test_missing_feature_event_is_skipped_with_reason():
    body = {"events": [{"type": "sunrise", "utc": "2027-02-20T10:00:00Z"}]}
    v = _vector(
        endpoint="/api/events",
        measure={"event": {"type": "eclipse_start", "index": 0}, "field": "utc", "kind": "utc"},
        expected="2027-02-20T22:09:00Z",
        threshold=2,
        unit="min",
        requires={"feature": "eclipse events in /api/events", "issue": "#41, F3-A1"},
    )
    row = rv.evaluate(v, _const(200, body))
    assert row["status"] == "skipped" and "#41" in row["note"]


def test_missing_event_without_requires_fails():
    body = {"events": []}
    v = _vector(
        endpoint="/api/events",
        measure={"event": {"type": "earthset", "index": 0}, "field": "utc", "kind": "utc"},
        expected="2026-12-03T10:03:00Z",
        threshold=2,
        unit="min",
    )
    assert rv.evaluate(v, _const(200, body))["status"] == "fail"


class _SubPoints:
    ANGLE_TOL_DEG = 0.01
    DISTANCE_TOL_KM = 1.0
    HORIZONS_CASES = [("2026-12-05T00:00:00Z", 5.966154, 5.929357, 231.377145, -1.455001, 0.00263691477836)]


def _body(**over):
    sample = {"sub_earth_lon_deg": 5.966, "sub_earth_lat_deg": 5.929, "sub_solar_lon_deg": -128.6228,
              "sub_solar_lat_deg": -1.455, "earth_distance_km": 0.00263691477836 * rv.AU_KM + 0.4}
    sample.update(over)
    return {"samples": [sample]}


def test_t8_rows_wrap_longitudes_and_use_the_test_tolerances():
    rows = rv.t8_rows(_const(200, _body()), load=lambda: _SubPoints)
    assert [r["status"] for r in rows] == ["pass"] * 5
    lon = next(r for r in rows if r["id"].endswith("sub-solar-lon"))
    assert abs(lon["diff"]) < 0.001  # -128.62 against 231.38 east
    rows = rv.t8_rows(_const(200, _body(sub_earth_lat_deg=5.95)), load=lambda: _SubPoints)
    assert next(r for r in rows if r["id"].endswith("sub-earth-lat"))["status"] == "fail"


def test_t8_missing_endpoint_is_skipped():
    rows = rv.t8_rows(_const(404, None), load=lambda: _SubPoints)
    assert {r["status"] for r in rows} == {"skipped"}


def test_t9_rows_on_the_repository_data():
    rows = rv.t9_rows()
    assert {r["status"] for r in rows} <= {"pass", "skipped"}
    assert len(rows) == 4


def test_t9_slope_above_the_limit_fails(tmp_path):
    import json
    import shutil

    data = Path(__file__).resolve().parents[3] / "data"
    shutil.copytree(data / "layers", tmp_path / "layers")
    stored = json.loads((data / "candidates.json").read_text(encoding="utf-8"))
    stored["candidates"][0]["mean_slope_deg"] = 12.5
    (tmp_path / "candidates.json").write_text(json.dumps(stored), encoding="utf-8")
    rows = {r["id"]: r for r in rv.t9_rows(tmp_path)}
    assert rows["T9-max-mean-slope"]["status"] == "fail"
    assert rows["T9-regenerated"]["status"] == "skipped"  # no full resolution layers in tmp_path
