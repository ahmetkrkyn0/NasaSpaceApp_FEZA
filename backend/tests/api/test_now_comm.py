"""Tests for ``GET /api/now`` and ``GET /api/comm-window``."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

MONS_MOUTON = {"site_id": "mons-mouton-im2-target", "mast_height_m": 0, "earth_criterion": "center"}
CHANGE_4 = {"site_id": "change-4", "utc": "2019-01-03T02:26:00Z"}


def _utc(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def test_now_on_6_december(client: TestClient) -> None:
    response = client.get("/api/now", params={**MONS_MOUTON, "utc": "2026-12-06T00:00:00Z"})

    assert response.status_code == 200
    body = response.json()
    assert body["earth_up"] is False
    assert body["hours_to_earthset"] is None
    assert body["hours_to_earthrise"] == pytest.approx(124.7, abs=0.05)
    assert body["search_limited"] is False
    assert body["mast_height_m"] == 0
    assert body["validity"] == "SYNTHETIC"
    assert_matches_example(body, "now")


def test_now_without_earthrise_is_search_limited(client: TestClient) -> None:
    body = client.get("/api/now", params=CHANGE_4).json()

    assert body["earth_up"] is False
    assert body["hours_to_earthrise"] is None
    assert body["search_limited"] is True


def test_comm_window_on_5_december(client: TestClient) -> None:
    response = client.get("/api/comm-window", params={**MONS_MOUTON, "utc": "2026-12-05T00:00:00Z"})

    assert response.status_code == 200
    body = response.json()
    assert body["visible_now"] is False
    assert body["minutes_remaining"] is None
    expected = datetime(2026, 12, 11, 4, 41, tzinfo=timezone.utc)
    assert abs(_utc(body["next_change_utc"]) - expected) <= timedelta(minutes=2)
    assert body["minutes_until_visible"] == pytest.approx(
        (_utc(body["next_change_utc"]) - _utc(body["utc"])).total_seconds() / 60, abs=1
    )
    assert body["lat_deg"] == pytest.approx(-84.78)
    assert body["search_limited"] is False
    assert body["relay_status"] == "intermittent"
    assert body["relay_required"] is False
    assert_matches_example(body, "comm-window")


def test_comm_window_without_earthrise_is_search_limited(client: TestClient) -> None:
    body = client.get("/api/comm-window", params=CHANGE_4).json()

    assert body["visible_now"] is False
    assert body["next_change_utc"] is None
    assert body["minutes_until_visible"] is None
    assert body["search_limited"] is True


def test_comm_window_at_change_4_landing_requires_a_relay(client: TestClient) -> None:
    params = {"site_id": "change-4", "mast_height_m": 0, "utc": "2019-01-03T02:26:00Z"}
    body = client.get("/api/comm-window", params=params).json()

    assert body["visible_now"] is False
    assert body["relay_status"] == "required"
    assert body["relay_required"] is True
    assert_matches_example(body, "comm-window-relay")


@pytest.mark.parametrize("path", ["/api/now", "/api/comm-window"])
@pytest.mark.parametrize(
    "override",
    [
        {"mast_height_m": -1},
        {"earth_criterion": "half_disk"},
        {"utc": "2026-12-05T00:00:00+03:00"},
        {"utc": None},
    ],
)
def test_invalid_parameters_return_422(client: TestClient, path: str, override: dict) -> None:
    params = {**MONS_MOUTON, "utc": "2026-12-05T00:00:00Z", **override}
    response = client.get(path, params={k: v for k, v in params.items() if v is not None})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "invalid_parameter"
    assert_matches_example(body, "error")
