"""Layer storage and ``GET /api/layers/{name}`` on a small stored grid."""

import re
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.terrain.layers import LayerMeta, layer_paths, layers_dir, load_layer, save_layer

ROWS, COLS = 3, 4


def _meta(name="elevation"):
    return LayerMeta(
        name=name,
        region="mons-mouton",
        rows=ROWS,
        cols=COLS,
        x_min=1000.0,
        y_min=2000.0,
        x_max=1080.0,
        y_max=2060.0,
        resolution_m=20.0,
        unit="m",
        product="PGDA 90 LDEM_80S_20MPP_ADJ",
        url="https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF",
    )


def _values():
    v = np.arange(ROWS * COLS, dtype=np.float32).reshape(ROWS, COLS) - 5.0
    v[1, 2] = np.nan
    return v


def test_save_and_load_round_trip(tmp_path):
    save_layer(tmp_path, _meta(), _values())
    data_path, meta_path = layer_paths(tmp_path, "mons-mouton", "elevation")
    assert data_path.stat().st_size == ROWS * COLS * 4
    layer = load_layer(tmp_path, "mons-mouton", "elevation")
    np.testing.assert_array_equal(layer.values, _values())
    assert layer.meta == _meta()


def test_headers(tmp_path):
    save_layer(tmp_path, _meta(), _values())
    h = load_layer(tmp_path, "mons-mouton", "elevation").headers()
    assert h["X-Layer-Rows"] == "3" and h["X-Layer-Cols"] == "4"
    assert h["X-Layer-Min"] == "-5" and h["X-Layer-Max"] == "6"
    assert h["X-Layer-Nodata"] == "1"
    assert h["X-Layer-Validity"] == "MEASURED"
    assert h["X-Layer-Bounds"] == "1000,2000,1080,2060"
    assert h["X-Layer-Resolution-M"] == "20"
    assert h["X-Layer-Source"] == "PGDA 90 LDEM_80S_20MPP_ADJ"


def test_shape_mismatch_rejected(tmp_path):
    with pytest.raises(ValueError):
        save_layer(tmp_path, _meta(), np.zeros((2, 2)))
    save_layer(tmp_path, _meta(), _values())
    data_path, _ = layer_paths(tmp_path, "mons-mouton", "elevation")
    data_path.write_bytes(b"\0" * 8)
    with pytest.raises(ValueError):
        load_layer(tmp_path, "mons-mouton", "elevation")


def test_missing_layer(tmp_path):
    with pytest.raises(FileNotFoundError):
        load_layer(tmp_path, "mons-mouton", "slope")


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    _save_region(layers_dir(tmp_path))
    from app.main import create_app

    return TestClient(create_app())


def test_endpoint_returns_float32_body(client):
    r = client.get("/api/layers/elevation", params={"format": "f32", "region": "mons-mouton"})
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/octet-stream"
    rows, cols = int(r.headers["X-Layer-Rows"]), int(r.headers["X-Layer-Cols"])
    assert len(r.content) == rows * cols * 4
    values = np.frombuffer(r.content, dtype="<f4").reshape(rows, cols)
    np.testing.assert_array_equal(values, _values())
    assert r.headers["X-Layer-Validity"] == "MEASURED"
    assert r.headers["X-Layer-Source"] == "PGDA 90 LDEM_80S_20MPP_ADJ"
    assert r.headers["X-Layer-Bounds"] == "1000,2000,1080,2060"
    assert "X-Layer-Bounds" in r.headers["Access-Control-Expose-Headers"]


def test_endpoint_defaults(client):
    assert client.get("/api/layers/elevation").status_code == 200


def test_missing_file_is_503(client, tmp_path):
    # One layer missing from the only folder: the region is not available.
    layer_paths(layers_dir(tmp_path), "mons-mouton", "slope")[0].unlink()
    r = client.get("/api/layers/slope", params={"format": "f32", "region": "mons-mouton"})
    assert r.status_code == 503
    assert r.json()["error"]["code"] == "data_unavailable"


@pytest.mark.parametrize(
    "path, params",
    [
        ("/api/layers/nope", {}),
        ("/api/layers/elevation", {"format": "png"}),
        ("/api/layers/elevation", {"region": "shackleton"}),
    ],
)
def test_bad_parameters_are_422(client, path, params):
    r = client.get(path, params=params)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_parameter"


def test_all_nan_layer_still_sends_min_and_max(tmp_path):
    save_layer(tmp_path, _meta(), np.full((ROWS, COLS), np.nan, dtype=np.float32))
    h = load_layer(tmp_path, "mons-mouton", "elevation").headers()
    assert h["X-Layer-Min"] == "nan" and h["X-Layer-Max"] == "nan"
    assert h["X-Layer-Nodata"] == str(ROWS * COLS)


def test_every_layer_has_a_source_unit_title_and_description():
    from app.terrain.layers import LAYER_DESCRIPTIONS, LAYER_NAMES, LAYER_SOURCES, LAYER_TITLES, LAYER_UNITS

    for name in LAYER_NAMES:
        assert name in LAYER_SOURCES and name in LAYER_UNITS
        assert LAYER_TITLES[name] and LAYER_DESCRIPTIONS[name]


def test_psr_comes_from_the_20_m_mask_on_the_same_grid_family():
    from app.terrain.layers import LAYER_SOURCES

    product, url = LAYER_SOURCES["psr"]
    assert product == "PGDA 90 LPSR_80S_20MPP_ADJ"
    assert url.endswith("/LOLA_20mpp/LPSR_80S_20MPP_ADJ.TIF")
    for other in ("elevation", "hillshade", "slope"):
        assert "80S_20MPP" in LAYER_SOURCES[other][0]


def test_psr_title_and_description_make_no_ice_claim():
    from app.terrain.layers import LAYER_DESCRIPTIONS, LAYER_TITLES

    assert "ice" not in LAYER_TITLES["psr"].lower()
    text = LAYER_DESCRIPTIONS["psr"]
    assert "Shadow only. Ice presence is uncertain." in text
    rest = text.replace("Ice presence is uncertain.", "").lower()
    assert not re.search(r"\b(ice|water|frost|volatile)", rest)


def test_psr_endpoint_serves_a_binary_mask(monkeypatch, tmp_path):
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    meta = _meta("psr")
    meta = LayerMeta(**{**meta.to_dict(), "unit": "1", "product": "PGDA 90 LPSR_80S_20MPP_ADJ"})
    mask = np.array([[0, 1, 1, 0], [0, 0, np.nan, 1], [1, 0, 0, 0]], dtype=np.float32)
    _save_region(layers_dir(tmp_path))
    save_layer(layers_dir(tmp_path), meta, mask)
    from app.main import create_app

    r = TestClient(create_app()).get("/api/layers/psr", params={"region": "mons-mouton"})
    assert r.status_code == 200
    assert r.headers["X-Layer-Validity"] == "MEASURED"
    assert r.headers["X-Layer-Min"] == "0" and r.headers["X-Layer-Max"] == "1"
    values = np.frombuffer(r.content, dtype="<f4")
    assert set(values[np.isfinite(values)].tolist()) <= {0.0, 1.0}


def test_stored_layers_share_one_grid():
    """The four stored Mons Mouton layers, when built locally (make_layers.py), share one grid."""

    from pathlib import Path

    from app.terrain.layers import LAYER_NAMES

    directory = layers_dir(Path(__file__).resolve().parents[3] / "data")
    stored = [load_layer(directory, "mons-mouton", n).meta for n in LAYER_NAMES
              if all(p.is_file() for p in layer_paths(directory, "mons-mouton", n))]
    keys = {(m.rows, m.cols, m.x_min, m.y_min, m.x_max, m.y_max, m.resolution_m) for m in stored}
    assert len(keys) <= 1
    for meta in stored:
        assert meta.validity == "MEASURED"


# ---------- bundled copy (data/layers), served on a clean checkout ----------

REPO_DATA = Path(__file__).resolve().parents[3] / "data"
BUNDLE_LIMIT_BYTES = 6_000_000  # #102


def test_downsample_mean_fraction_and_nan():
    from app.terrain.layers import downsample_values

    v = np.array([[1, 3, 0, 1], [5, 7, 1, 1], [np.nan, np.nan, 2, np.nan], [np.nan, np.nan, 4, np.nan]],
                 dtype=np.float32)
    out = downsample_values(v, 2)
    assert out.shape == (2, 2)
    assert out[0, 0] == 4.0          # mean of 1, 3, 5, 7
    assert out[0, 1] == 0.75         # fraction of ones in a 0/1 block
    assert np.isnan(out[1, 0])       # no valid cell
    assert out[1, 1] == 3.0          # NaN cells are skipped


def test_downsample_layer_meta(tmp_path):
    from app.terrain.layers import downsample_layer

    meta = LayerMeta(**{**_meta().to_dict(), "rows": 4, "cols": 4, "y_min": 1980.0})
    values = np.arange(16, dtype=np.float32).reshape(4, 4)
    small = downsample_layer(load_layer_from(tmp_path, meta, values), 2)
    m = small.meta
    assert (m.rows, m.cols, m.resolution_m, m.downsample) == (2, 2, 40.0, 2)
    assert (m.x_min, m.y_min, m.x_max, m.y_max) == (1000.0, 1980.0, 1080.0, 2060.0)
    assert m.downsample_method == "mean" and m.source_max == 15.0


def load_layer_from(directory, meta, values):
    save_layer(directory, meta, values)
    return load_layer(directory, meta.region, meta.name)


def test_bundled_layers_are_committed_and_small():
    from app.terrain.layers import DOWNSAMPLE_METHODS, LAYER_NAMES, LAYER_SOURCES, bundled_layers_dir

    directory = bundled_layers_dir(REPO_DATA)
    metas = [load_layer(directory, "mons-mouton", n).meta for n in LAYER_NAMES]
    total = sum(p.stat().st_size for n in LAYER_NAMES for p in layer_paths(directory, "mons-mouton", n))
    assert total <= BUNDLE_LIMIT_BYTES
    assert len({(m.rows, m.cols, m.x_min, m.y_min, m.x_max, m.y_max, m.resolution_m) for m in metas}) == 1
    for m in metas:
        assert m.validity == "DERIVED"
        assert m.product == LAYER_SOURCES[m.name][0] and m.url == LAYER_SOURCES[m.name][1]
        assert m.downsample_method == DOWNSAMPLE_METHODS[m.name]
        assert m.resolution_m == 20.0 * m.downsample
        assert m.source_max is not None
    psr = load_layer(directory, "mons-mouton", "psr")
    finite = psr.values[np.isfinite(psr.values)]
    assert finite.min() >= 0.0 and finite.max() <= 1.0
    assert psr.meta.description.endswith("Shadow only. Ice presence is uncertain.")
    rest = psr.meta.description.replace("Ice presence is uncertain.", "").lower()
    assert not re.search(r"\b(ice|water|frost|volatile)", rest)


def test_clean_checkout_serves_bundled_layers(monkeypatch, tmp_path):
    """No data/raw/layers: all four layers come from data/layers with 200."""

    import shutil

    from app.terrain.layers import LAYER_NAMES

    shutil.copytree(REPO_DATA / "layers", tmp_path / "layers")
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    from app.main import create_app

    c = TestClient(create_app())
    for name in LAYER_NAMES:
        r = c.get(f"/api/layers/{name}")
        assert r.status_code == 200, name
        assert r.headers["X-Layer-Downsample"] == "2"
        assert r.headers["X-Layer-Resolution-M"] == "40"
        assert len(r.content) == int(r.headers["X-Layer-Rows"]) * int(r.headers["X-Layer-Cols"]) * 4
    assert c.get("/api/health").json()["layers_available"] is True


def _save_region(directory, offset=0.0):
    from app.terrain.layers import LAYER_NAMES

    for name in LAYER_NAMES:
        save_layer(directory, _meta(name), _values() + offset)


def test_full_resolution_copy_wins(monkeypatch, tmp_path):
    from app.terrain.layers import bundled_layers_dir

    _save_region(bundled_layers_dir(tmp_path), offset=100)
    _save_region(layers_dir(tmp_path))
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    from app.main import create_app

    r = TestClient(create_app()).get("/api/layers/elevation")
    np.testing.assert_array_equal(np.frombuffer(r.content, dtype="<f4").reshape(ROWS, COLS), _values())


def test_partial_full_resolution_folder_is_ignored(monkeypatch, tmp_path):
    """Only one layer in data/raw/layers: all four still come from data/layers, on one grid."""

    from app.terrain.layers import LAYER_NAMES, bundled_layers_dir

    _save_region(bundled_layers_dir(tmp_path), offset=100)
    full = LayerMeta(**{**_meta().to_dict(), "rows": 6, "cols": 8, "resolution_m": 10.0})
    save_layer(layers_dir(tmp_path), full, np.zeros((6, 8), dtype=np.float32))
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    from app.main import create_app

    c = TestClient(create_app())
    for name in LAYER_NAMES:
        r = c.get(f"/api/layers/{name}")
        assert (r.headers["X-Layer-Rows"], r.headers["X-Layer-Resolution-M"]) == ("3", "20"), name
    np.testing.assert_array_equal(
        np.frombuffer(c.get("/api/layers/elevation").content, dtype="<f4").reshape(ROWS, COLS),
        _values() + 100,
    )
    assert c.get("/api/health").json()["layers_available"] is True


def test_partial_folders_alone_are_not_available(monkeypatch, tmp_path):
    save_layer(layers_dir(tmp_path), _meta(), _values())
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    from app.main import create_app

    c = TestClient(create_app())
    assert c.get("/api/layers/elevation").status_code == 503
    assert c.get("/api/health").json()["layers_available"] is False


def test_downsample_factor_bounds(tmp_path):
    from app.terrain.layers import downsample_layer

    layer = load_layer_from(tmp_path, _meta(), _values())
    for factor in (1, 4):
        with pytest.raises(ValueError):
            downsample_layer(layer, factor)


def test_health_reports_missing_layers(monkeypatch, tmp_path):
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    from app.main import create_app

    assert TestClient(create_app()).get("/api/health").json()["layers_available"] is False


def _wide_client(monkeypatch, tmp_path, store=True):
    from app.terrain.layers import WIDE_REGIONS

    region = WIDE_REGIONS["south-pole-cap"]
    if store:
        meta = LayerMeta(
            name="elevation", region=region.id, rows=ROWS, cols=COLS,
            x_min=-640.0, y_min=-480.0, x_max=640.0, y_max=480.0, resolution_m=320.0,
            unit="m", product=region.product, url=region.url, validity="DERIVED", downsample=4,
        )
        save_layer(layers_dir(tmp_path), meta, _values())
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    from app.main import create_app

    return TestClient(create_app())


def test_wide_region_covers_the_80_s_cap_of_the_80_m_map():
    from app.terrain.layers import REGIONS, WIDE_REGIONS

    cap = WIDE_REGIONS["south-pole-cap"]
    # 80 S on the south polar map: 2 R tan(5 deg) from the pole.
    assert abs(cap.half_size_m - 2 * 1_737_400 * np.tan(np.radians(5))) < 100
    assert cap.url.endswith("LDEM_80S_80MPP_ADJ.TIF")
    assert cap.factor * 80 == 320
    # The detailed regions, which candidates and the recommendation use, stay as they were.
    assert list(REGIONS) == ["mons-mouton"]


def test_wide_region_serves_only_elevation(monkeypatch, tmp_path):
    client = _wide_client(monkeypatch, tmp_path)
    r = client.get("/api/layers/elevation", params={"region": "south-pole-cap"})
    assert r.status_code == 200
    assert r.headers["X-Layer-Resolution-M"] == "320"
    assert r.headers["X-Layer-Bounds"] == "-640,-480,640,480"
    assert r.headers["X-Layer-Validity"] == "DERIVED"
    assert len(r.content) == ROWS * COLS * 4
    bad = client.get("/api/layers/slope", params={"region": "south-pole-cap"})
    assert bad.status_code == 422
    assert "has only 'elevation'" in bad.json()["error"]["message"]


def test_wide_region_missing_is_503_and_unknown_region_is_422(monkeypatch, tmp_path):
    client = _wide_client(monkeypatch, tmp_path, store=False)
    assert client.get("/api/layers/elevation", params={"region": "south-pole-cap"}).status_code == 503
    assert client.get("/api/layers/elevation", params={"region": "nowhere"}).status_code == 422
