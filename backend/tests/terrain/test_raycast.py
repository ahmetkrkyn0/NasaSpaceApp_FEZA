"""Terrain horizon on synthetic terrain (ufuk-hesabi.md, "Arazi ufku")."""

import math

import numpy as np
import pytest

from app.terrain.horizon import horizon_dip_deg
from app.terrain.projection import MOON_RADIUS_M
from app.terrain.raycast import (
    azimuths_deg,
    curvature_drop_m,
    sample_distances_m,
    terrain_horizon,
    view_angles_deg,
)

LAT, LON = -84.78, 29.13


def _distance_and_bearing(lat_deg, lon_deg):
    """Great-circle distance (m) and initial bearing (deg) from the site."""
    p1, l1 = math.radians(LAT), math.radians(LON)
    p2, l2 = np.radians(lat_deg), np.radians(lon_deg)
    dl = l2 - l1
    a = np.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    dist = 2 * MOON_RADIUS_M * np.arcsin(np.sqrt(np.clip(a, 0, 1)))
    bearing = np.degrees(
        np.arctan2(np.sin(dl) * np.cos(p2), math.cos(p1) * np.sin(p2) - math.sin(p1) * np.cos(p2) * np.cos(dl))
    ) % 360.0
    return dist, bearing


def flat(lat, lon):
    return np.zeros(np.shape(lat))


def test_curvature_drop_at_100_km_is_about_2_9_km():
    assert curvature_drop_m(100_000.0) == pytest.approx(2878.0, abs=1.0)
    assert curvature_drop_m(100_000.0) / 1000.0 == pytest.approx(2.9, abs=0.05)


def test_view_angles_match_reference_examples():
    # 2 m observer, hill 100 km away (dogrulama/ufuk-ve-isik-isi.md, No A-12).
    assert view_angles_deg(1500.0, 2.0, 100_000.0) == pytest.approx(-0.791, abs=0.001)
    assert view_angles_deg(5000.0, 2.0, 100_000.0) == pytest.approx(1.215, abs=0.001)


def test_sampling_scheme():
    d = sample_distances_m()
    steps = np.diff(d)
    assert d[0] == 20.0
    assert d[-1] <= 150_000.0 and d[-1] > 148_000.0
    assert np.allclose(steps[d[:-1] < 3000.0], 20.0)
    assert np.allclose(steps[d[:-1] >= 75_000.0], 2000.0)
    assert np.all(np.diff(steps) >= -1e-9)
    assert len(azimuths_deg()) == 720
    assert azimuths_deg()[1] == 0.5


@pytest.mark.parametrize("mast", [1.0, 2.0, 5.0, 10.0])
def test_flat_terrain_equals_flat_horizon(mast):
    h = terrain_horizon(flat, LAT, LON, mast, ground_height_m=0.0)
    assert h.shape == (720,)
    assert np.max(np.abs(h + horizon_dip_deg(mast))) < 0.001


def test_ground_height_read_from_sampler():
    def raised(lat, lon):
        return np.full(np.shape(lat), -1234.0)

    h = terrain_horizon(raised, LAT, LON, 2.0)
    assert np.max(np.abs(h + horizon_dip_deg(2.0))) < 0.001


def test_ring_wall_gives_expected_angle():
    wall_m, dist_m, mast = 100.0, 2000.0, 2.0

    def ring(lat, lon):
        d, _ = _distance_and_bearing(lat, lon)
        return np.where((d >= dist_m - 1.0) & (d <= dist_m + 500.0), wall_m, 0.0)

    h = terrain_horizon(ring, LAT, LON, mast, ground_height_m=0.0)
    expected = math.degrees(math.atan((wall_m - mast - dist_m**2 / (2 * MOON_RADIUS_M)) / dist_m))
    assert np.max(np.abs(h - expected)) < 1e-6


def test_wall_only_in_the_east():
    wall_m, dist_m, mast = 300.0, 10_000.0, 2.0

    def east_wall(lat, lon):
        d, b = _distance_and_bearing(lat, lon)
        return np.where((d >= dist_m - 300.0) & (np.abs(b - 90.0) <= 20.0), wall_m, 0.0)

    h = terrain_horizon(east_wall, LAT, LON, mast, ground_height_m=0.0)
    az = azimuths_deg()
    east = h[az == 90.0][0]
    west = h[az == 270.0][0]
    assert east > 1.0
    assert west == pytest.approx(-horizon_dip_deg(mast), abs=0.001)


def test_outside_map_is_ignored():
    def half(lat, lon):
        _, b = _distance_and_bearing(lat, lon)
        return np.where(b < 180.0, 0.0, np.nan)

    h = terrain_horizon(half, LAT, LON, 2.0, ground_height_m=0.0)
    assert np.all(np.isfinite(h[1:359]))  # 0.5 to 179 deg, clear of the edges


def test_negative_mast_rejected():
    with pytest.raises(ValueError):
        terrain_horizon(flat, LAT, LON, -1.0, ground_height_m=0.0)
