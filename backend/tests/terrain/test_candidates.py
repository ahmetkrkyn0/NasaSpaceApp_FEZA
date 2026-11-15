"""Candidate regions (#103): window metrics, selection, the stored file and the API."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.terrain import candidates as cd
from app.terrain.layers import bundled_layers_dir, layer_exists, layers_dir, load_layer
from tests.contract import assert_matches_example

REPO_DATA = Path(__file__).resolve().parents[3] / "data"
KERNELS = REPO_DATA / "raw" / "kernels"


def _grid(slope, psr=None, elevation=None, res=20.0):
    slope = np.asarray(slope, dtype=float)
    return cd.Grid(
        elevation=np.zeros_like(slope) if elevation is None else np.asarray(elevation, float),
        slope=slope,
        psr=np.zeros_like(slope) if psr is None else np.asarray(psr, float),
        x_min=0.0, y_max=1000.0, resolution_m=res,
    )


def test_window_metrics():
    slope = np.zeros((4, 4))
    slope[0, 0] = 20.0  # one unsafe cell in the top-left 2 x 2 window
    psr = np.zeros((4, 4))
    psr[3, 3] = 1.0
    stats = cd.window_stats(_grid(slope, psr), window_m=40, stride_m=40)
    assert stats["mean_slope_deg"].shape == (2, 2)
    assert stats["mean_slope_deg"][0, 0] == 5.0
    assert stats["max_slope_deg"][0, 0] == 20.0
    assert stats["safe_cell_fraction"][0, 0] == 0.75
    assert stats["psr_fraction"][1, 1] == 0.25
    assert stats["centre_in_psr"][1, 1]  # the centre cell of a 2 x 2 window is its (1, 1)


def test_missing_cells_make_a_window_incomplete():
    slope = np.zeros((4, 4))
    slope[0, 1] = np.nan
    stats = cd.window_stats(_grid(slope), window_m=40, stride_m=40)
    assert not stats["complete"][0, 0] and np.isnan(stats["mean_slope_deg"][0, 0])
    assert stats["complete"][1, 1]


def test_selection_limits_and_separation():
    slope = np.full((20, 20), 2.0)
    slope[:, 10:] = 15.0  # right half above the limit
    psr = np.zeros((20, 20))
    psr[1, 1] = 1.0  # shadowed centre of the top-left window
    grid = _grid(slope, psr)
    stats = cd.window_stats(grid, window_m=40, stride_m=20)
    chosen = cd.select(stats, grid, min_separation_km=0.1, max_count=50)
    assert chosen
    for c in chosen:
        assert stats["mean_slope_deg"][c["index"]] <= cd.SLOPE_LIMIT_DEG
        assert not stats["centre_in_psr"][c["index"]]
    for a in chosen:
        for b in chosen:
            if a is not b:
                assert np.hypot(a["x"] - b["x"], a["y"] - b["y"]) >= 100.0
    assert cd.select(stats, grid, min_separation_km=0.1, max_count=3) == chosen[:3]


def test_distance_to_psr():
    psr = np.zeros((3, 3))
    psr[0, 0] = 1.0
    grid = _grid(np.zeros((3, 3)), psr)
    points = cd.psr_points(grid)
    assert cd.distance_to_psr_km(points, 10.0, 990.0) == 0.0
    assert cd.distance_to_psr_km(points, 50.0, 990.0) == pytest.approx(0.04)
    assert cd.distance_to_psr_km(np.empty((0, 2)), 0.0, 0.0) is None


# ---------- the stored file ----------

@pytest.fixture(scope="module")
def stored():
    return json.loads((REPO_DATA / "candidates.json").read_text(encoding="utf-8"))


# ``method`` fields of this PR (ADR-0003, "Candidates") that the example and the frontend type
# do not carry yet (#109 added ``kind`` only). Each one is stripped only while the example lacks
# it, so the comparison becomes exact as soon as the example catches up.
PENDING_METHOD_FIELDS = {"stride_m", "slope_limit_source", "max_candidates", "assumed", "note"}


def test_stored_file_shape(stored):
    from tests.contract import load_example

    example_method = set(load_example("candidates")["method"])
    pending = PENDING_METHOD_FIELDS - example_method
    assert pending <= set(stored["method"])
    compared = {**stored, "method": {k: v for k, v in stored["method"].items() if k not in pending}}
    assert_matches_example(compared, "candidates")
    assert stored["region"] == "mons-mouton" and stored["validity"] == "DERIVED"
    method = stored["method"]
    assert method["slope_limit_deg"] == 12.0
    assert "No 89" in method["slope_limit_source"]
    assert set(method["assumed"]) == {"window_m", "stride_m", "min_separation_km", "max_candidates"}
    assert "not certified landing sites" in method["note"]
    assert "not modelled" in method["note"]
    ids = [e["id"] for e in stored["candidates"]]
    assert len(ids) == len(set(ids))
    kinds = {e["kind"] for e in stored["candidates"]}
    assert kinds == {"candidate", "catalogue"}


def test_candidates_pass_the_limits(stored):
    """No candidate centre is permanently shadowed and no mean slope is above the limit."""

    raw = layers_dir(REPO_DATA)
    directory = raw if layer_exists(raw, "mons-mouton", "psr") else bundled_layers_dir(REPO_DATA)
    psr = load_layer(directory, "mons-mouton", "psr")
    grid = cd.Grid(elevation=psr.values, slope=psr.values, psr=psr.values,
                   x_min=psr.meta.x_min, y_max=psr.meta.y_max, resolution_m=psr.meta.resolution_m)
    cands = [e for e in stored["candidates"] if e["kind"] == "candidate"]
    assert 1 <= len(cands) <= cd.MAX_CANDIDATES
    for e in cands:
        assert e["id"].startswith("cand-") and e["name"].startswith("Candidate ")
        assert e["mean_slope_deg"] <= 12.0, e["id"]
        r, c = grid.xy_cell(*cd.site_xy(e))
        assert psr.values[r, c] < 0.5, e["id"]  # bundled copy: shadowed fraction of the cell
        assert e["has_terrain_horizon"] is True
        for h in (2, 10):
            assert (REPO_DATA / "horizons" / f"{e['id']}_{h}m.json").is_file()
    for a in cands:
        for b in cands:
            if a is not b:
                (ax, ay), (bx, by) = cd.site_xy(a), cd.site_xy(b)
                # Coordinates are rounded to 1e-5 deg (about 0.3 m at -85 deg).
                assert np.hypot(ax - bx, ay - by) >= stored["method"]["min_separation_km"] * 1000 - 1


def test_catalogue_entries_are_real_sites(stored):
    sites = {s["id"] for s in json.loads((REPO_DATA / "sites.json").read_text(encoding="utf-8"))}
    cat = [e["id"] for e in stored["candidates"] if e["kind"] == "catalogue"]
    assert "mons-mouton-im2-target" in cat
    assert set(cat) <= sites


# ---------- API ----------

@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("FEZA_DATA_DIR", str(REPO_DATA))
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(KERNELS))
    from app.main import create_app

    return TestClient(create_app())


def test_candidates_endpoint(client, stored):
    r = client.get("/api/candidates")
    assert r.status_code == 200
    assert r.json() == stored
    assert client.get("/api/candidates", params={"region": "mons-mouton"}).status_code == 200
    assert client.get("/api/candidates", params={"region": "nope"}).status_code == 422


def test_candidates_missing_file_is_503(monkeypatch, tmp_path):
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    from app.main import create_app

    r = TestClient(create_app()).get("/api/candidates")
    assert r.status_code == 503 and r.json()["error"]["code"] == "data_unavailable"


def test_sites_list_is_unchanged(client):
    sites = client.get("/api/sites").json()
    assert len(sites) == 10
    assert not any(s["id"].startswith("cand-") for s in sites)


def test_candidate_id_resolves_as_site(client, stored):
    cand = next(e for e in stored["candidates"] if e["id"] == "cand-01")
    r = client.get("/api/horizon", params={"site_id": "cand-01", "mast_height_m": 2})
    assert r.status_code == 200
    body = r.json()
    assert body["method"] == "terrain" and body["validity"] == "DERIVED"
    assert body["lat_deg"] == cand["lat_deg"]
    assert client.get("/api/horizon", params={"site_id": "cand-99", "mast_height_m": 2}).status_code == 404


@pytest.mark.skipif(not KERNELS.is_dir(), reason="SPICE kernels not downloaded")
def test_events_for_a_candidate(client):
    r = client.get("/api/events", params={
        "site_id": "cand-01", "mast_height_m": 2,
        "start_utc": "2026-12-01T00:00:00Z", "end_utc": "2026-12-08T00:00:00Z",
    })
    assert r.status_code == 200
    assert r.json()["validity"] == "DERIVED"
