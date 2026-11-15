"""Tests for ``POST /api/recommend`` on the stored candidate regions (#100)."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core import recommend as rc
from tests.contract import assert_matches_example

REPO_DATA = Path(__file__).resolve().parents[3] / "data"
KERNELS = REPO_DATA / "raw" / "kernels"

pytestmark = pytest.mark.skipif(not KERNELS.is_dir(), reason="SPICE kernels not downloaded")

BODY = {
    "region": "mons-mouton",
    "start_utc": "2026-12-01T00:00:00Z",
    "end_utc": "2026-12-04T00:00:00Z",
    "mast_height_m": 2,
    "weights": {"sunlit": 1.0, "dark": 1.0, "earth": 1.0, "slope": 1.0, "roughness": 0.5, "psr_distance": 0.0},
    "limits": {"max_slope_deg": 12.0},
    "psr_preference": "far",
    "include_catalogue_sites": True,
}


@pytest.fixture
def repo_client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("FEZA_DATA_DIR", str(REPO_DATA))
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(KERNELS))
    from app.main import create_app

    return TestClient(create_app())


def test_recommend_matches_the_example(repo_client: TestClient) -> None:
    r = repo_client.post("/api/recommend", json=BODY)
    assert r.status_code == 200
    body = r.json()
    assert_matches_example(body, "recommend")
    assert body["weights"] == BODY["weights"]
    assert body["limits"] == {"max_slope_deg": 12.0}
    ids = {s["site_id"] for s in body["ranked"]}
    assert "cand-01" in ids and "mons-mouton-im2-target" in ids
    assert body["validity"] == "DERIVED"
    assert any("does not certify a landing site" in a for a in body["assumptions"])


def test_recommend_without_catalogue_sites(repo_client: TestClient) -> None:
    r = repo_client.post("/api/recommend", json={**BODY, "include_catalogue_sites": False})
    assert r.status_code == 200
    assert all(s["site_id"].startswith("cand-") for s in r.json()["ranked"])


def test_a_lower_slope_limit_eliminates_steep_windows(repo_client: TestClient) -> None:
    r = repo_client.post("/api/recommend", json={**BODY, "limits": {"max_slope_deg": 3.0}})
    assert r.status_code == 200
    ranked = r.json()["ranked"]
    dropped = [s for s in ranked if s["eliminated"]]
    assert dropped, "some windows have a slope above 3 degrees"
    assert all(s["score"] is None and s["eliminated_by"] == ["max_slope_deg"] for s in dropped)
    assert ranked[-len(dropped):] == dropped


def test_all_zero_weights_is_422(repo_client: TestClient) -> None:
    r = repo_client.post("/api/recommend", json={**BODY, "weights": dict.fromkeys(rc.WEIGHT_KEYS, 0)})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_parameter"


def test_missing_weights_is_422(repo_client: TestClient) -> None:
    body = {k: v for k, v in BODY.items() if k != "weights"}
    r = repo_client.post("/api/recommend", json=body)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_parameter"


def test_without_candidates_file_is_503(client: TestClient) -> None:
    r = client.post("/api/recommend", json=BODY)
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "data_unavailable"
