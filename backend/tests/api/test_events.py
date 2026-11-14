"""Tests for ``GET /api/events`` (T2b through the API)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

T2B_PARAMS = {
    "site_id": "mons-mouton-im2-target",
    "mast_height_m": 0,
    "start_utc": "2026-12-01T00:00:00Z",
    "end_utc": "2026-12-31T00:00:00Z",
    "earth_criterion": "center",
}
T2B_EARTH_EVENTS = [
    ("earthset", datetime(2026, 12, 3, 10, 3, tzinfo=timezone.utc)),
    ("earthrise", datetime(2026, 12, 11, 4, 41, tzinfo=timezone.utc)),
    ("earthset", datetime(2026, 12, 30, 11, 2, tzinfo=timezone.utc)),
]


def _utc(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def test_t2b_earth_events(client: TestClient) -> None:
    response = client.get("/api/events", params=T2B_PARAMS)

    assert response.status_code == 200
    body = response.json()
    earth = [e for e in body["events"] if e["type"] in ("earthrise", "earthset")]
    assert [e["type"] for e in earth] == [kind for kind, _ in T2B_EARTH_EVENTS]
    for event, (_, expected) in zip(earth, T2B_EARTH_EVENTS):
        assert abs(_utc(event["utc"]) - expected) <= timedelta(minutes=2)
        assert event["criterion"] == "center"
        assert _utc(event["utc_earliest"]) <= _utc(event["utc"]) <= _utc(event["utc_latest"])
    assert body["metrics"]["earth_visible_fraction"] == pytest.approx(0.723, abs=0.005)
    assert body["mast_height_m"] == 0
    assert body["validity"] == "SYNTHETIC"
    assert_matches_example(body, "events")


def test_windows_cover_the_range(client: TestClient) -> None:
    body = client.get("/api/events", params=T2B_PARAMS).json()

    earth = [w for w in body["windows"] if w["kind"] in ("earth_visible", "earth_hidden")]
    assert earth[0]["start_utc"] == T2B_PARAMS["start_utc"]
    assert earth[-1]["end_utc"] == T2B_PARAMS["end_utc"]
    for before, after in zip(earth, earth[1:]):
        assert before["end_utc"] == after["start_utc"]


def test_change_4_never_sees_earth(client: TestClient) -> None:
    params = {
        "site_id": "change-4",
        "start_utc": "2019-01-03T00:00:00Z",
        "end_utc": "2019-03-04T00:00:00Z",
    }
    body = client.get("/api/events", params=params).json()

    assert body["metrics"]["earth_visible_fraction"] == 0.0
    assert not [e for e in body["events"] if e["type"] in ("earthrise", "earthset")]


def test_default_criterion_is_center(client: TestClient) -> None:
    params = {k: v for k, v in T2B_PARAMS.items() if k != "earth_criterion"}
    body = client.get("/api/events", params=params).json()

    assert {e["criterion"] for e in body["events"] if e["type"].startswith("earth")} == {"center"}


@pytest.mark.parametrize(
    "override",
    [
        {"mast_height_m": -1},
        {"earth_criterion": "half_disk"},
        {"end_utc": "2026-11-30T00:00:00Z"},
        {"end_utc": "2027-03-01T00:00:00Z"},
        {"end_utc": None},
    ],
)
def test_invalid_parameters_return_422(client: TestClient, override: dict) -> None:
    params = {k: v for k, v in {**T2B_PARAMS, **override}.items() if v is not None}
    response = client.get("/api/events", params=params)

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "invalid_parameter"
    assert_matches_example(body, "error")
