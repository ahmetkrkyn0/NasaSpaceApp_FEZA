"""Tests for ``GET /api/sky-series``."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

BASE_PARAMS = {
    "lat_deg": -84.7906,
    "lon_deg": 29.1957,
    "mast_height_m": 0,
    "start_utc": "2025-03-06T17:30:00Z",
    "hours": 0,
}


def test_sky_series_single_sample(client: TestClient) -> None:
    response = client.get("/api/sky-series", params=BASE_PARAMS)

    assert response.status_code == 200
    body = response.json()
    assert len(body["samples"]) == 1
    sample = body["samples"][0]
    assert sample["utc"] == "2025-03-06T17:30:00Z"
    assert sample["sun"]["azimuth_true_deg"] == pytest.approx(65.67, abs=0.01)
    assert sample["sun"]["elevation_deg"] == pytest.approx(2.47, abs=0.01)
    assert sample["earth"]["azimuth_true_deg"] == pytest.approx(335.85, abs=0.01)
    assert sample["earth"]["elevation_deg"] == pytest.approx(11.19, abs=0.01)
    assert body["ephemeris"] == {
        "source": "SPICE DE440",
        "frame": "MOON_ME",
        "correction": "LT+S",
    }
    assert body["horizon"] == {"method": "sphere", "validity": "SYNTHETIC"}
    assert body["validity"] == "SYNTHETIC"
    assert sample["sun"]["horizon_deg"] == pytest.approx(0.0, abs=1e-9)
    assert sample["earth"]["horizon_deg"] == pytest.approx(0.0, abs=1e-9)
    assert sample["sun"]["visible_fraction"] == pytest.approx(1.0)
    assert sample["earth"]["visible_fraction"] == pytest.approx(1.0)
    assert 0.26 <= sample["sun"]["radius_deg"] <= 0.28
    assert 356000 <= sample["earth"]["range_km"] <= 407000
    assert_matches_example(body, "sky-series")


def test_sky_series_hourly_samples(client: TestClient) -> None:
    params = dict(BASE_PARAMS, hours=24, step_minutes=60)
    response = client.get("/api/sky-series", params=params)

    assert response.status_code == 200
    body = response.json()
    assert len(body["samples"]) == 25
    assert body["samples"][0]["utc"] == "2025-03-06T17:30:00Z"
    assert body["samples"][-1]["utc"] == "2025-03-07T17:30:00Z"


def test_sky_series_default_mast_height(client: TestClient) -> None:
    params = {
        key: value for key, value in BASE_PARAMS.items() if key != "mast_height_m"
    }
    response = client.get("/api/sky-series", params=params)

    assert response.status_code == 200
    body = response.json()
    assert body["mast_height_m"] == 2.0
    sample = body["samples"][0]
    assert sample["sun"]["horizon_deg"] == pytest.approx(-0.087, abs=0.01)
    assert sample["earth"]["horizon_deg"] == pytest.approx(-0.087, abs=0.01)


def test_sky_series_by_site_id(client: TestClient) -> None:
    params = {"site_id": "change4", "start_utc": "2019-01-03T02:26:00Z", "hours": 0}
    response = client.get("/api/sky-series", params=params)

    assert response.status_code == 200
    body = response.json()
    assert body["lat_deg"] == pytest.approx(-45.4446)
    assert body["lon_deg"] == pytest.approx(177.5991)


def test_sky_series_normalizes_longitude(client: TestClient) -> None:
    params = dict(BASE_PARAMS, lon_deg=206.0148)
    response = client.get("/api/sky-series", params=params)

    assert response.status_code == 200
    body = response.json()
    assert body["lon_deg"] == pytest.approx(-153.9852, abs=1e-6)
