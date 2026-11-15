"""Tests for ``GET /api/ground-stations`` and ``GET /api/earth-link``."""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

DECEMBER = {"start_utc": "2026-12-01T00:00:00Z", "end_utc": "2026-12-31T00:00:00Z"}
STATION_IDS = ["dsn-goldstone", "dsn-madrid", "dsn-canberra"]
# The Apollo 11 position in data/sites.json; the test fixture catalogue does not
# list the site, and without a terrain profile both give the same flat horizon.
APOLLO_11 = {"lat_deg": 0.67416, "lon_deg": 23.47314}


def _utc(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def _earth_link(client: TestClient, **params: object) -> dict:
    response = client.get("/api/earth-link", params={**DECEMBER, **params})
    assert response.status_code == 200, response.text
    return response.json()


def _assert_covers(body: dict, start: str, end: str) -> None:
    """``link_windows`` cover the range without gaps or overlaps."""
    windows = body["link_windows"]
    assert windows[0]["start_utc"] == start
    assert windows[-1]["end_utc"] == end
    for before, after in zip(windows, windows[1:]):
        assert before["end_utc"] == after["start_utc"]
        assert before["mode"] != after["mode"]
    for window in windows:
        assert _utc(window["start_utc"]) < _utc(window["end_utc"])
        if window["mode"] == "direct":
            assert window["station_ids"]
        else:
            assert window["station_ids"] == []


def test_ground_stations_list_the_three_dsn_complexes(client: TestClient) -> None:
    response = client.get("/api/ground-stations")

    assert response.status_code == 200
    body = response.json()
    assert [station["id"] for station in body] == STATION_IDS
    for station in body:
        assert station["validity"] == "MEASURED"
        assert station["source"]["url"].startswith("https://deepspace.jpl.nasa.gov/")
        assert station["source"]["label"]
    assert_matches_example(body, "ground-stations")


def test_ground_stations_without_the_data_file(no_data_client: TestClient) -> None:
    response = no_data_client.get("/api/ground-stations")

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "data_unavailable"


def test_earth_link_at_mons_mouton(client: TestClient) -> None:
    body = _earth_link(client, site_id="mons-mouton-im2-target", mast_height_m=0)

    assert_matches_example(body, "earth-link")
    assert body["min_station_elevation_deg"] == 10.0
    assert [station["id"] for station in body["stations"]] == STATION_IDS
    for station in body["stations"]:
        assert 0.3 < station["in_view_fraction"] < 0.5
        assert len(station["windows"]) >= 28
    _assert_covers(body, DECEMBER["start_utc"], DECEMBER["end_utc"])

    modes = {window["mode"] for window in body["link_windows"]}
    assert modes == {"direct", "no_station", "relay_needed"}
    # Earth below the flat horizon from 3 to 11 December, the same edges as
    # /api/events and /api/comm-window (docs/design/iletisim-penceresi.md).
    relay = [w for w in body["link_windows"] if w["mode"] == "relay_needed"]
    assert abs(_utc(relay[0]["start_utc"]) - _utc("2026-12-03T10:03:00Z")) <= timedelta(minutes=2)
    assert abs(_utc(relay[0]["end_utc"]) - _utc("2026-12-11T04:41:00Z")) <= timedelta(minutes=2)
    assert body["validity"] == "SYNTHETIC"


def test_earth_link_with_terrain_is_derived(client: TestClient) -> None:
    body = _earth_link(client, site_id="mons-mouton-im2-target", mast_height_m=2)

    assert body["validity"] == "DERIVED"
    assert not any("terrain is not modelled" in note for note in body["assumptions"])
    _assert_covers(body, DECEMBER["start_utc"], DECEMBER["end_utc"])


def test_change_4_needs_a_relay_for_the_whole_range(client: TestClient) -> None:
    params = {"start_utc": "2019-01-03T02:26:00Z", "end_utc": "2019-03-03T02:26:00Z"}
    body = _earth_link(client, site_id="change-4", **params)

    assert body["link_windows"] == [
        {**{k: params[k] for k in ("start_utc", "end_utc")}, "mode": "relay_needed", "station_ids": []}
    ]
    # Stations still see the Moon; only the site cannot see Earth.
    assert all(station["windows"] for station in body["stations"])
    assert body["validity"] == "SYNTHETIC"


def test_apollo_11_never_needs_a_relay(client: TestClient) -> None:
    body = _earth_link(client, **APOLLO_11)

    modes = {window["mode"] for window in body["link_windows"]}
    assert "relay_needed" not in modes
    assert "direct" in modes
    _assert_covers(body, DECEMBER["start_utc"], DECEMBER["end_utc"])


def test_earth_link_for_custom_coordinates(client: TestClient) -> None:
    body = _earth_link(client, lat_deg=-89.9, lon_deg=0.0, end_utc="2026-12-03T00:00:00Z")

    _assert_covers(body, DECEMBER["start_utc"], "2026-12-03T00:00:00Z")
    assert body["validity"] == "SYNTHETIC"


def test_assumptions_name_the_model_limits(client: TestClient) -> None:
    body = _earth_link(client, **APOLLO_11, end_utc="2026-12-02T00:00:00Z")
    text = " ".join(body["assumptions"])

    assert "Station view is computed for the Moon's centre, not for the site." in body["assumptions"]
    assert "IAU_EARTH" in text and "nutation" in text and "UT1" in text
    assert "refraction" in text
    assert "(10 degrees) is assumed" in text
    assert "relay_needed only says that there is no direct view" in text


def test_a_lower_threshold_widens_the_station_windows(client: TestClient) -> None:
    short = {**APOLLO_11, "end_utc": "2026-12-03T00:00:00Z"}
    default = _earth_link(client, **short)
    lower = _earth_link(client, **short, min_station_elevation_deg=6)

    assert lower["min_station_elevation_deg"] == 6.0
    assert any("(6 degrees) is the requested value" in note for note in lower["assumptions"])
    for low, base in zip(lower["stations"], default["stations"]):
        assert low["in_view_fraction"] > base["in_view_fraction"]


@pytest.mark.parametrize(
    "params",
    [
        {**APOLLO_11, "min_station_elevation_deg": 90},
        {**APOLLO_11, "min_station_elevation_deg": -1},
        {**APOLLO_11, "end_utc": "2026-11-30T00:00:00Z"},
        {**APOLLO_11, "end_utc": "2027-03-01T00:00:00Z"},
        {**APOLLO_11, "earth_criterion": "limb"},
        {**APOLLO_11, "mast_height_m": -2},
        {"lat_deg": -95.0, "lon_deg": 0.0},
    ],
)
def test_earth_link_rejects_bad_parameters(client: TestClient, params: dict) -> None:
    response = client.get("/api/earth-link", params={**DECEMBER, **params})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_parameter"


def test_earth_link_requires_the_range(client: TestClient) -> None:
    response = client.get("/api/earth-link", params=APOLLO_11)

    assert response.status_code == 422
    assert "start_utc" in response.json()["error"]["message"]


def test_earth_link_unknown_site(client: TestClient) -> None:
    response = client.get("/api/earth-link", params={**DECEMBER, "site_id": "nowhere"})

    assert response.status_code == 404
