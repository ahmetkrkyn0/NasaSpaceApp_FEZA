"""Tests for the catalog endpoints: sites, panel profiles, reference missions."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

FIXTURES_DIR: Path = Path(__file__).resolve().parents[1] / "fixtures"


def _load_fixture(name: str) -> object:
    with (FIXTURES_DIR / name).open(encoding="utf-8") as handle:
        return json.load(handle)


def test_sites_returns_fixture_list(client: TestClient) -> None:
    response = client.get("/api/sites")

    assert response.status_code == 200
    body = response.json()
    assert body == _load_fixture("sites.json")
    assert len(body) == 3
    athena = next(site for site in body if site["id"] == "im2-athena")
    assert athena["fixture_extra"] is True
    assert_matches_example(body, "sites")


def test_sites_filters_by_category(client: TestClient) -> None:
    response = client.get("/api/sites", params={"category": "clps"})

    assert response.status_code == 200
    body = response.json()
    assert [site["id"] for site in body] == ["im2-athena"]


def test_panel_profiles_returns_fixture_contents(client: TestClient) -> None:
    response = client.get("/api/panel-profiles")

    assert response.status_code == 200
    body = response.json()
    assert body == _load_fixture("panel_profiles.json")
    assert_matches_example(body, "panel-profiles")


def test_reference_missions_returns_fixture_contents(client: TestClient) -> None:
    response = client.get("/api/reference-missions")

    assert response.status_code == 200
    body = response.json()
    assert body == _load_fixture("reference_missions.json")
    assert_matches_example(body, "reference-missions")


@pytest.mark.parametrize(
    "path",
    ["/api/sites", "/api/panel-profiles", "/api/reference-missions"],
)
def test_catalog_endpoints_without_data(
    no_data_client: TestClient, path: str
) -> None:
    response = no_data_client.get(path)

    assert response.status_code == 503
    body = response.json()
    assert body["error"]["code"] == "data_unavailable"
    assert_matches_example(body, "error")
