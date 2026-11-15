"""Tests for ``GET /api/body-series``.

The angles themselves are checked against JPL Horizons in
``tests/core/test_sub_points.py``; here the endpoint is checked for its
contract, its sampling and its error responses (ADR-0004).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

RANGE_PARAMS = {
    "start_utc": "2026-12-05T00:00:00Z",
    "end_utc": "2026-12-06T00:00:00Z",
    "step_s": 43200,
}


def test_body_series_single_instant(client: TestClient) -> None:
    response = client.get("/api/body-series", params={"utc": "2026-12-05T00:00:00Z"})

    assert response.status_code == 200
    body = response.json()
    assert body["frame"] == "MOON_ME"
    assert body["validity"] == "DERIVED"
    assert len(body["samples"]) == 1
    sample = body["samples"][0]
    assert sample["utc"] == "2026-12-05T00:00:00Z"
    # Horizons SunSub-LON 231.377145 east = -128.622855 in [-180, 180).
    assert sample["sub_solar_lon_deg"] == pytest.approx(-128.622855, abs=0.01)
    assert sample["sub_solar_lat_deg"] == pytest.approx(-1.455001, abs=0.01)
    assert sample["sub_earth_lon_deg"] == pytest.approx(5.966154, abs=0.01)
    assert sample["sub_earth_lat_deg"] == pytest.approx(5.929357, abs=0.01)
    assert sample["earth_distance_km"] == pytest.approx(394476.83, abs=1.0)
    assert_matches_example(body, "body-series")


def test_body_series_matches_example(client: TestClient) -> None:
    response = client.get("/api/body-series", params=RANGE_PARAMS)

    assert response.status_code == 200
    body = response.json()
    assert_matches_example(body, "body-series")
    assert [sample["utc"] for sample in body["samples"]] == [
        "2026-12-05T00:00:00Z",
        "2026-12-05T12:00:00Z",
        "2026-12-06T00:00:00Z",
    ]


def test_body_series_default_step_is_one_hour(client: TestClient) -> None:
    params = {"start_utc": "2026-12-05T00:00:00Z", "end_utc": "2026-12-06T00:00:00Z"}
    response = client.get("/api/body-series", params=params)

    assert response.status_code == 200
    assert len(response.json()["samples"]) == 25


def test_body_series_ends_at_range_end_for_partial_step(client: TestClient) -> None:
    params = {
        "start_utc": "2026-12-05T00:00:00Z",
        "end_utc": "2026-12-05T01:30:00Z",
        "step_s": 3600,
    }
    response = client.get("/api/body-series", params=params)

    assert response.status_code == 200
    assert [sample["utc"] for sample in response.json()["samples"]] == [
        "2026-12-05T00:00:00Z",
        "2026-12-05T01:00:00Z",
        "2026-12-05T01:30:00Z",
    ]


def test_body_series_equal_ends_give_one_sample(client: TestClient) -> None:
    params = {"start_utc": "2026-12-05T00:00:00Z", "end_utc": "2026-12-05T00:00:00Z"}
    response = client.get("/api/body-series", params=params)

    assert response.status_code == 200
    assert len(response.json()["samples"]) == 1


def test_body_series_longitudes_are_wrapped(client: TestClient) -> None:
    params = {
        "start_utc": "2026-12-01T00:00:00Z",
        "end_utc": "2026-12-31T00:00:00Z",
        "step_s": 21600,
    }
    response = client.get("/api/body-series", params=params)

    assert response.status_code == 200
    for sample in response.json()["samples"]:
        assert -180.0 <= sample["sub_solar_lon_deg"] < 180.0
        assert -180.0 <= sample["sub_earth_lon_deg"] < 180.0


def test_body_series_accepts_the_largest_range(client: TestClient) -> None:
    params = {
        "start_utc": "2026-12-01T00:00:00Z",
        "end_utc": "2027-01-30T00:00:00Z",
        "step_s": 600,
    }
    response = client.get("/api/body-series", params=params)

    assert response.status_code == 200
    assert len(response.json()["samples"]) == 60 * 144 + 1


@pytest.mark.parametrize(
    "params",
    [
        pytest.param({}, id="nothing"),
        pytest.param({"start_utc": "2026-12-05T00:00:00Z"}, id="no-end"),
        pytest.param({"end_utc": "2026-12-05T00:00:00Z"}, id="no-start"),
        pytest.param({"utc": "2026-12-05T00:00:00Z", "step_s": 60}, id="utc-and-step"),
        pytest.param(
            {"utc": "2026-12-05T00:00:00Z", "start_utc": "2026-12-05T00:00:00Z"},
            id="utc-and-start",
        ),
        pytest.param({"utc": "2026-12-05T00:00:00"}, id="no-zone"),
        pytest.param({"utc": "2026-12-05T03:00:00+03:00"}, id="offset"),
        pytest.param(dict(RANGE_PARAMS, step_s=59), id="step-too-small"),
        pytest.param(dict(RANGE_PARAMS, step_s=0), id="step-zero"),
        pytest.param(dict(RANGE_PARAMS, step_s="hour"), id="step-not-a-number"),
        pytest.param(
            dict(RANGE_PARAMS, start_utc="2026-12-06T00:00:00Z", end_utc="2026-12-05T00:00:00Z"),
            id="end-before-start",
        ),
        pytest.param(
            dict(
                RANGE_PARAMS,
                start_utc="2026-12-01T00:00:00Z",
                end_utc="2027-01-30T00:00:01Z",
                step_s=3600,
            ),
            id="range-too-long",
        ),
        pytest.param(
            dict(RANGE_PARAMS, end_utc="2026-12-12T00:00:00Z", step_s=60),
            id="too-many-samples",
        ),
    ],
)
def test_body_series_invalid_parameters(client: TestClient, params: dict) -> None:
    response = client.get("/api/body-series", params=params)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_parameter"


@pytest.mark.parametrize(
    "params",
    [
        pytest.param({"utc": "1500-01-01T00:00:00Z"}, id="single"),
        pytest.param(
            {"start_utc": "2150-01-19T00:00:00Z", "end_utc": "2150-01-25T00:00:00Z"},
            id="range-end",
        ),
    ],
)
def test_body_series_date_out_of_range(client: TestClient, params: dict) -> None:
    response = client.get("/api/body-series", params=params)

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "date_out_of_range"
    assert "outside the computable range" in body["error"]["message"]


def test_body_series_without_kernels(no_kernels_client: TestClient) -> None:
    response = no_kernels_client.get("/api/body-series", params={"utc": "2026-12-05T00:00:00Z"})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "data_unavailable"
