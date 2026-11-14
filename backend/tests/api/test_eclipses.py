"""Tests for ``GET /api/eclipses`` and the eclipse and relay fields of ``GET /api/events`` (T5)."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

TWO_MINUTES = timedelta(minutes=2)
# The fixture data has no Apollo 11 site record, so its coordinates are sent directly.
T5_PARAMS = {
    "lat_deg": 0.67416,
    "lon_deg": 23.47314,
    "mast_height_m": 0,
    "start_utc": "2027-02-20T00:00:00Z",
    "end_utc": "2027-02-22T00:00:00Z",
}


def _utc(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def _check_t5(events: list[dict]) -> None:
    eclipse = [e for e in events if e["type"].startswith("eclipse")]
    assert [e["type"] for e in eclipse] == ["eclipse_start", "eclipse_end"]
    start, end = eclipse
    assert abs(_utc(start["utc"]) - _utc("2027-02-20T22:09:00Z")) <= TWO_MINUTES
    assert abs(_utc(end["utc"]) - _utc("2027-02-21T00:36:00Z")) <= TWO_MINUTES
    for event in eclipse:
        assert event["max_obscured_fraction"] == pytest.approx(0.343, abs=0.005)
        assert event["criterion"] == "first_limb"
        assert event["utc_earliest"] is None and event["utc_latest"] is None


def test_t5_eclipses_endpoint(client: TestClient) -> None:
    response = client.get("/api/eclipses", params=T5_PARAMS)

    assert response.status_code == 200
    body = response.json()
    _check_t5(body["events"])
    assert body["windows"] == []
    assert set(body["metrics"].values()) == {None}
    assert "relay_status" not in body and "relay_required" not in body
    assert body["validity"] == "SYNTHETIC"
    assert_matches_example(body, "events-eclipse")


def test_t5_eclipses_in_events(client: TestClient) -> None:
    body = client.get("/api/events", params=dict(T5_PARAMS, earth_criterion="center")).json()

    _check_t5(body["events"])
    others = [e for e in body["events"] if not e["type"].startswith("eclipse")]
    assert all("max_obscured_fraction" not in e for e in others)
    assert [e["utc"] for e in body["events"]] == sorted(e["utc"] for e in body["events"])
    assert_matches_example(body, "events")


@pytest.mark.parametrize(
    "params, status",
    [
        ({"site_id": "change-4", "start_utc": "2019-01-01T00:00:00Z", "end_utc": "2019-03-01T00:00:00Z"}, "required"),
        (
            {"site_id": "mons-mouton-im2-target", "start_utc": "2026-12-01T00:00:00Z", "end_utc": "2026-12-31T00:00:00Z"},
            "intermittent",
        ),
        (
            {"site_id": "mons-mouton-im2-target", "start_utc": "2026-12-05T00:00:00Z", "end_utc": "2026-12-09T00:00:00Z"},
            "unknown",
        ),
    ],
)
def test_relay_label_in_events(client: TestClient, params: dict, status: str) -> None:
    body = client.get("/api/events", params=dict(params, mast_height_m=0)).json()

    assert body["relay_status"] == status
    assert body["relay_required"] is (status == "required")


def test_eclipses_without_start_returns_422(client: TestClient) -> None:
    params = {key: value for key, value in T5_PARAMS.items() if key != "start_utc"}
    response = client.get("/api/eclipses", params=params)

    assert response.status_code == 422
    assert_matches_example(response.json(), "error")
