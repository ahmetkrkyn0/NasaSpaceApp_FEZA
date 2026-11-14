"""Tests for ``GET /api/health``."""

from __future__ import annotations

from fastapi.testclient import TestClient

from tests.contract import assert_matches_example


def test_health_reports_loaded_kernels(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["kernels_loaded"] is True
    assert body["ephemeris_range"] == {
        "start_utc": "1849-12-27T00:00:00Z",
        "end_utc": "2150-01-20T00:00:00Z",
    }
    assert_matches_example(body, "health")


def test_health_with_corrupt_kernels(corrupt_kernels_client: TestClient) -> None:
    response = corrupt_kernels_client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["kernels_loaded"] is False
    assert body["ephemeris_range"] is None


def test_health_without_kernels(no_kernels_client: TestClient) -> None:
    response = no_kernels_client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["kernels_loaded"] is False
    assert body["ephemeris_range"] is None
    assert_matches_example(body, "health")
