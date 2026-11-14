"""``GET /api/horizon`` against the repository data (F2-B acceptance)."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.contract import assert_matches_example

REPO_DATA = Path(__file__).resolve().parents[3] / "data"


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("FEZA_DATA_DIR", str(REPO_DATA))
    from app.main import create_app

    return TestClient(create_app())


def test_test_site_at_2_m_is_terrain(client):
    r = client.get("/api/horizon", params={"site_id": "mons-mouton-im2-target", "mast_height_m": 2})
    assert r.status_code == 200
    body = r.json()
    assert body["method"] == "terrain"
    assert body["validity"] == "DERIVED"
    assert len(body["horizon_deg"]) == 720
    assert body["dem"]["product"] == "PGDA 90 LDEM_80S_20MPP_ADJ"
    assert_matches_example(body, "horizon")


def test_test_site_at_5_m_is_sphere(client):
    r = client.get("/api/horizon", params={"site_id": "mons-mouton-im2-target", "mast_height_m": 5})
    body = r.json()
    assert r.status_code == 200
    assert body["method"] == "sphere"
    assert body["validity"] == "SYNTHETIC"
    assert body["site_id"] == "mons-mouton-im2-target"
    assert body["horizon_deg"][0] == pytest.approx(-0.137, abs=0.001)  # T4
    assert_matches_example(body, "horizon")


def test_custom_coordinate_is_synthetic_sphere(client):
    r = client.get("/api/horizon", params={"lat_deg": -85.0, "lon_deg": 30.0, "mast_height_m": 2})
    body = r.json()
    assert r.status_code == 200
    assert body["method"] == "sphere"
    assert body["validity"] == "SYNTHETIC"
    assert body["site_id"] is None
    assert body["dem"] is None
    assert body["horizon_deg"][0] == pytest.approx(-0.087, abs=0.001)  # T4
    assert_matches_example(body, "horizon")


@pytest.mark.parametrize("site_id", ["im2-athena", "im1-odysseus", "chandrayaan-3"])
@pytest.mark.parametrize("height", [2, 10])
def test_new_sites_serve_terrain(client, site_id, height):
    r = client.get("/api/horizon", params={"site_id": site_id, "mast_height_m": height})
    assert r.status_code == 200
    assert r.json()["method"] == "terrain"


def test_site_outside_maps_stays_flat(client):
    body = client.get("/api/horizon", params={"site_id": "apollo-11", "mast_height_m": 2}).json()
    assert body["method"] == "sphere" and body["validity"] == "SYNTHETIC"


def test_default_mast_is_2_m(client):
    body = client.get("/api/horizon", params={"site_id": "mons-mouton-im2-target"}).json()
    assert body["mast_height_m"] == 2.0 and body["method"] == "terrain"


@pytest.mark.parametrize(
    "params, status, code",
    [
        ({"site_id": "nowhere"}, 404, "site_not_found"),
        ({"site_id": "mons-mouton-im2-target", "mast_height_m": -1}, 422, "invalid_parameter"),
        ({"lat_deg": 95, "lon_deg": 0}, 422, "invalid_parameter"),
        ({"lat_deg": 10}, 422, "invalid_parameter"),
        ({}, 422, "invalid_parameter"),
    ],
)
def test_errors(client, params, status, code):
    r = client.get("/api/horizon", params=params)
    assert r.status_code == status
    assert r.json()["error"]["code"] == code
