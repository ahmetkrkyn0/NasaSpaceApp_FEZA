"""Tests for ``POST /api/compare``."""

from __future__ import annotations

from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

METRICS = {
    "sunlit_fraction",
    "longest_dark_hours",
    "max_sun_elevation_deg",
    "earth_visible_fraction",
    "longest_earth_hidden_hours",
    "mean_power_w",
}


def _scenario(scenario_id: str, **extra: object) -> dict:
    return {
        "scenario_id": scenario_id,
        "label": f"Scenario {scenario_id}",
        "site_id": "mons-mouton-im2-target",
        "lat_deg": None,
        "lon_deg": None,
        "start_utc": "2026-12-01T00:00:00Z",
        "end_utc": "2026-12-31T00:00:00Z",
        "mast_height_m": 0,
        "panel_profile_id": "vertical_tracking",
        "earth_criterion": "center",
        **extra,
    }


def test_compare_two_scenarios(client: TestClient) -> None:
    request = {
        "scenarios": [
            _scenario("a"),
            _scenario("b", start_utc="2026-12-06T00:00:00Z", end_utc="2027-01-05T00:00:00Z"),
        ]
    }
    response = client.post("/api/compare", json=request)

    assert response.status_code == 200
    body = response.json()
    assert [s["scenario"]["scenario_id"] for s in body["scenarios"]] == ["a", "b"]
    first = body["scenarios"][0]
    assert abs(first["metrics"]["earth_visible_fraction"] - 0.723) <= 0.005
    assert first["now"]["utc"] == "2026-12-01T00:00:00Z"
    assert {d["metric"] for d in body["deltas"]} == METRICS
    for delta in body["deltas"]:
        assert set(delta["values"]) == {"a", "b"}
        assert delta["best_scenario_id"] in ("a", "b", None)
    assert_matches_example(body, "compare")


def test_best_scenario_follows_metric_direction(client: TestClient) -> None:
    request = {"scenarios": [_scenario("flat"), _scenario("raised", mast_height_m=20)]}
    body = client.post("/api/compare", json=request).json()
    deltas = {d["metric"]: d for d in body["deltas"]}

    power = deltas["mean_power_w"]["values"]
    assert power["raised"] > power["flat"]
    assert deltas["mean_power_w"]["best_scenario_id"] == "raised"
    dark = deltas["longest_dark_hours"]["values"]
    if dark["raised"] != dark["flat"]:
        assert deltas["longest_dark_hours"]["best_scenario_id"] == min(dark, key=dark.get)


def test_terrain_against_flat_is_labelled_synthetic(client: TestClient) -> None:
    request = {
        "scenarios": [
            _scenario("terrain", mast_height_m=2, end_utc="2026-12-03T00:00:00Z"),
            _scenario("flat", mast_height_m=0, end_utc="2026-12-03T00:00:00Z"),
        ]
    }
    body = client.post("/api/compare", json=request).json()
    validity = {s["scenario"]["scenario_id"]: s["validity"] for s in body["scenarios"]}

    # Terrain (DERIVED) against the flat horizon (SYNTHETIC): the comparison is SYNTHETIC.
    assert validity == {"terrain": "SYNTHETIC", "flat": "SYNTHETIC"}


def test_five_scenarios_return_too_many_scenarios(client: TestClient) -> None:
    request = {"scenarios": [_scenario(str(i)) for i in range(5)]}
    response = client.post("/api/compare", json=request)

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "too_many_scenarios"
    assert_matches_example(body, "error")


def test_one_scenario_returns_422(client: TestClient) -> None:
    response = client.post("/api/compare", json={"scenarios": [_scenario("a")]})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_parameter"


def test_duplicate_ids_return_422(client: TestClient) -> None:
    response = client.post("/api/compare", json={"scenarios": [_scenario("a"), _scenario("a")]})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_parameter"


def test_negative_mast_returns_422(client: TestClient) -> None:
    request = {"scenarios": [_scenario("a", mast_height_m=-1), _scenario("b")]}
    response = client.post("/api/compare", json=request)

    assert response.status_code == 422
    assert_matches_example(response.json(), "error")
