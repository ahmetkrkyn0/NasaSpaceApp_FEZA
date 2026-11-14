"""South polar stereographic projection (ADR-0004, map layers)."""

import json
from pathlib import Path

import numpy as np
import pytest

from app.terrain.projection import destination, latlon_to_xy, normalize_lon, xy_to_latlon

VECTORS = Path(__file__).resolve().parents[3] / "data" / "examples" / "projection_vectors.json"


def test_south_pole_is_origin():
    x, y = latlon_to_xy(-90.0, 0.0)
    assert x == pytest.approx(0.0, abs=1e-9)
    assert y == pytest.approx(0.0, abs=1e-9)
    for lon in (-170.0, -45.0, 33.3, 120.0):
        x, y = latlon_to_xy(-90.0, lon)
        assert abs(x) < 1e-6 and abs(y) < 1e-6


def test_round_trip_within_a_billionth_of_a_degree():
    rng = np.random.default_rng(34)
    lat = rng.uniform(-89.999, -60.0, 5000)
    lon = rng.uniform(-180.0, 180.0, 5000)
    x, y = latlon_to_xy(lat, lon)
    lat2, lon2 = xy_to_latlon(x, y)
    assert np.max(np.abs(lat2 - lat)) < 1e-9
    dlon = (lon2 - lon + 180.0) % 360.0 - 180.0
    assert np.max(np.abs(dlon)) < 1e-9


def test_axes():
    # 0 E along +y, 90 E along +x.
    x, y = latlon_to_xy(-85.0, 0.0)
    assert abs(x) < 1e-6 and y > 0
    x, y = latlon_to_xy(-85.0, 90.0)
    assert x > 0 and abs(y) < 1e-6


@pytest.mark.parametrize(
    "point", json.loads(VECTORS.read_text(encoding="utf-8"))["points"], ids=lambda p: p["id"]
)
def test_projection_vectors(point):
    x, y = latlon_to_xy(point["lat_deg"], point["lon_deg"])
    assert x == pytest.approx(point["x_m"], abs=1e-3)
    assert y == pytest.approx(point["y_m"], abs=1e-3)
    if point["lat_deg"] > -90.0:
        lat, lon = xy_to_latlon(point["x_m"], point["y_m"])
        assert lat == pytest.approx(point["lat_deg"], abs=1e-7)
        assert normalize_lon(lon - point["lon_deg"]) == pytest.approx(0.0, abs=1e-7)


def test_normalize_lon():
    assert normalize_lon(206.0148) == pytest.approx(-153.9852)
    assert normalize_lon(-180.0) == -180.0
    assert normalize_lon(180.0) == -180.0
    assert normalize_lon(359.5) == pytest.approx(-0.5)


def test_destination_north_and_east():
    lat, lon = destination(0.0, 0.0, 0.0, 1737400.0 * np.radians(1.0))
    assert lat == pytest.approx(1.0)
    assert lon == pytest.approx(0.0, abs=1e-12)
    lat, lon = destination(0.0, 0.0, 90.0, 1737400.0 * np.radians(1.0))
    assert lat == pytest.approx(0.0, abs=1e-12)
    assert lon == pytest.approx(1.0)
