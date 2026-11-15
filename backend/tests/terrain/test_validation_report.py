"""``data/validation_report.json`` and ``GET /api/validation`` (F3-B acceptance)."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

REPO_DATA = Path(__file__).resolve().parents[3] / "data"
REPORT = REPO_DATA / "validation_report.json"

ROW_FIELDS = (
    "id", "test", "title", "condition", "kind", "expected", "measured", "diff",
    "threshold", "unit", "status", "source", "endpoint", "note",
)
REFERENCE_TESTS = {"T1", "T2a", "T2b", "T3", "T4", "T5", "T6", "T7", "T8", "T9"}


@pytest.fixture
def report():
    with open(REPORT, encoding="utf-8") as f:
        return json.load(f)


def _client(monkeypatch, data_dir):
    monkeypatch.setenv("FEZA_DATA_DIR", str(data_dir))
    from app.main import create_app

    return TestClient(create_app())


def test_every_reference_test_has_rows_with_all_fields(report):
    assert {row["test"] for row in report["rows"]} == REFERENCE_TESTS
    for row in report["rows"]:
        for key in ROW_FIELDS:
            assert key in row, (row["id"], key)
        assert row["condition"]
        assert row["source"]


def test_summary_counts_the_rows(report):
    counts = {status: 0 for status in ("pass", "warn", "fail", "skipped", "info")}
    for row in report["rows"]:
        counts[row["status"]] += 1
    assert report["summary"] == counts


def test_t3_rows_come_from_the_unit_test(report):
    rows = [row for row in report["rows"] if row["test"] == "T3"]
    assert len(rows) == 14
    for row in rows:
        assert row["endpoint"] is None
        assert "test_power.py" in row["note"]


def test_t6_is_an_approximate_comparison_without_threshold(report):
    (row,) = [row for row in report["rows"] if row["test"] == "T6"]
    assert row["kind"] == "approximate"
    assert row["threshold"] is None
    assert row["status"] in ("info", "skipped")
    assert row["status"] != "pass"
    assert "not a validation" in row["note"]


def test_only_t6_is_approximate(report):
    for row in report["rows"]:
        if row["test"] != "T6":
            assert row["kind"] == "reference"
            assert row["status"] != "info"


def test_api_returns_the_report_file(monkeypatch, report):
    r = _client(monkeypatch, REPO_DATA).get("/api/validation")
    assert r.status_code == 200
    assert r.json() == report


def test_api_without_report_is_503(monkeypatch, tmp_path):
    r = _client(monkeypatch, tmp_path).get("/api/validation")
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "data_unavailable"


def test_t8_rows_follow_the_horizons_reference(report):
    rows = [row for row in report["rows"] if row["test"] == "T8"]
    assert len(rows) == 20  # four instants, five quantities
    for row in rows:
        assert row["endpoint"] == "/api/body-series"
        assert row["threshold"] == (1.0 if row["unit"] == "km" else 0.01)
        assert "test_sub_points.py" in row["source"]


def test_t9_rows_check_the_candidate_limits(report):
    rows = {row["id"]: row for row in report["rows"] if row["test"] == "T9"}
    assert set(rows) == {"T9-max-mean-slope", "T9-centres-in-shadow", "T9-min-separation",
                         "T9-regenerated"}
    assert rows["T9-max-mean-slope"]["expected_range"] == [None, 12.0]
    assert rows["T9-centres-in-shadow"]["expected_range"] == [0, 0]
