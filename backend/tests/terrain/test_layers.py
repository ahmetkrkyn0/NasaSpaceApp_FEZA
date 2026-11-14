"""Layer storage and ``GET /api/layers/{name}`` on a small stored grid."""

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
    save_layer(layers_dir(tmp_path), _meta(), _values())
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


def test_missing_file_is_503(client):
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
