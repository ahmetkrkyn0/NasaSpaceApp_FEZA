"""Tests for ``GET /api/power``."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

PARAMS = {
    "site_id": "mons-mouton-im2-target",
    "mast_height_m": 0,
    "start_utc": "2026-12-01T00:00:00Z",
    "end_utc": "2027-01-01T00:00:00Z",
    "panel_profile_id": "vertical_tracking",
}


def test_power_series(client: TestClient) -> None:
    response = client.get("/api/power", params=PARAMS)

    assert response.status_code == 200
    body = response.json()
    assert len(body["samples"]) == 745
    assert body["panel_profile_id"] == "vertical_tracking"
    assert body["fixed_azimuth_deg"] is None
    # T3 flat horizon 768.8 W/m² times the fixture efficiency 0.28.
    assert body["summary"]["mean_power_w"] == pytest.approx(768.8 * 0.28, rel=0.005)
    assert body["summary"]["longest_dark_hours"] == pytest.approx(280, abs=1)
    assert body["validity"] == "SYNTHETIC"
    assert_matches_example(body, "power")


def test_fixed_panel_facing_west_gets_nothing_from_an_eastern_sun(client: TestClient) -> None:
    params = dict(PARAMS, panel_profile_id="vertical_fixed", fixed_azimuth_deg=270)
    body = client.get("/api/power", params=params).json()
    sky = client.get(
        "/api/sky-series",
        params={"site_id": PARAMS["site_id"], "mast_height_m": 0, "start_utc": PARAMS["start_utc"], "hours": 744},
    ).json()

    assert body["fixed_azimuth_deg"] == 270
    east = [i for i, s in enumerate(sky["samples"]) if 0 < s["sun"]["azimuth_true_deg"] < 180]
    assert east
    assert all(body["samples"][i]["power_w"] == 0 for i in east)


def test_mast_height_defaults_to_the_panel_profile(client: TestClient) -> None:
    params = {k: v for k, v in PARAMS.items() if k != "mast_height_m"}
    body = client.get("/api/power", params=dict(params, end_utc="2026-12-02T00:00:00Z")).json()

    assert body["mast_height_m"] == 2.0


def test_validity_is_the_lower_of_panel_and_horizon(client: TestClient) -> None:
    """Terrain horizon (DERIVED) with the fixture panel (SYNTHETIC) gives SYNTHETIC."""

    params = dict(PARAMS, mast_height_m=2, end_utc="2026-12-02T00:00:00Z")
    body = client.get("/api/power", params=params).json()

    assert body["validity"] == "SYNTHETIC"


def test_unknown_panel_returns_422(client: TestClient) -> None:
    response = client.get("/api/power", params=dict(PARAMS, panel_profile_id="nope"))

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_parameter"


def test_negative_mast_returns_422(client: TestClient) -> None:
    response = client.get("/api/power", params=dict(PARAMS, mast_height_m=-1))

    assert response.status_code == 422
    assert_matches_example(response.json(), "error")
