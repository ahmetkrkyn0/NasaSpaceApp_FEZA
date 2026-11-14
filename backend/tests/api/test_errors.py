"""Error-path tests for the API; every body must match the ``error`` example."""

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


def _assert_error(response, status_code: int, code: str) -> dict:
    assert response.status_code == status_code
    body = response.json()
    assert body["error"]["code"] == code
    assert isinstance(body["error"]["message"], str)
    assert_matches_example(body, "error")
    return body


def test_unknown_site_returns_404(client: TestClient) -> None:
    response = client.get("/api/sky-series", params={"site_id": "nope"})

    _assert_error(response, 404, "site_not_found")


def test_latitude_out_of_range_returns_422(client: TestClient) -> None:
    params = dict(BASE_PARAMS, lat_deg=95)
    response = client.get("/api/sky-series", params=params)

    _assert_error(response, 422, "invalid_parameter")


def test_missing_start_utc_returns_422(client: TestClient) -> None:
    params = {key: value for key, value in BASE_PARAMS.items() if key != "start_utc"}
    response = client.get("/api/sky-series", params=params)

    _assert_error(response, 422, "invalid_parameter")


def test_zero_step_minutes_returns_422(client: TestClient) -> None:
    params = dict(BASE_PARAMS, step_minutes=0)
    response = client.get("/api/sky-series", params=params)

    _assert_error(response, 422, "invalid_parameter")


def test_too_many_hours_returns_422(client: TestClient) -> None:
    params = dict(BASE_PARAMS, hours=1441)
    response = client.get("/api/sky-series", params=params)

    _assert_error(response, 422, "invalid_parameter")


def test_negative_mast_height_returns_422(client: TestClient) -> None:
    params = dict(BASE_PARAMS, mast_height_m=-1)
    response = client.get("/api/sky-series", params=params)

    _assert_error(response, 422, "invalid_parameter")


def test_date_out_of_range_returns_422(client: TestClient) -> None:
    params = dict(BASE_PARAMS, start_utc="2200-01-01T00:00:00Z")
    response = client.get("/api/sky-series", params=params)

    body = _assert_error(response, 422, "date_out_of_range")
    message = body["error"]["message"]
    assert "1849-12-27" in message
    assert "2150-01-20" in message


def test_sky_series_without_kernels_returns_503(
    no_kernels_client: TestClient,
) -> None:
    response = no_kernels_client.get("/api/sky-series", params=BASE_PARAMS)

    _assert_error(response, 503, "data_unavailable")


def test_sky_series_with_corrupt_kernels_returns_503(
    corrupt_kernels_client: TestClient,
) -> None:
    response = corrupt_kernels_client.get("/api/sky-series", params=BASE_PARAMS)

    _assert_error(response, 503, "data_unavailable")


def test_unknown_site_without_data_returns_503(no_data_client: TestClient) -> None:
    response = no_data_client.get("/api/sky-series", params={"site_id": "nope"})

    _assert_error(response, 503, "data_unavailable")
