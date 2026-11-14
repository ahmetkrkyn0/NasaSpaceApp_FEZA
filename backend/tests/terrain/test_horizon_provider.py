"""Horizon provider and lookup (ADR-0003, mast height rule)."""

import json

import pytest

from app.terrain.horizon import (
    HORIZONS_DIR,
    HorizonProfile,
    get_horizon_profile,
    horizon_at,
    horizon_dip_deg,
    profile_path,
)

SITE = "mons-mouton-im2-target"
LAT, LON = -84.78, 29.13


def _profile(values):
    return HorizonProfile(
        lat_deg=0.0, lon_deg=0.0, site_id=None, mast_height_m=2.0,
        horizon_deg=values, method="sphere",
    )


def test_horizon_at_exact_samples():
    p = _profile([float(i) for i in range(720)])
    assert horizon_at(p, 0.0) == 0.0
    assert horizon_at(p, 0.5) == 1.0
    assert horizon_at(p, 359.5) == 719.0


def test_horizon_at_linear_between_neighbours():
    p = _profile([float(i) for i in range(720)])
    assert horizon_at(p, 10.25) == pytest.approx(20.5)
    assert horizon_at(p, 370.25) == pytest.approx(20.5)
    assert horizon_at(p, -0.25) == pytest.approx(359.5)


def test_horizon_at_wraps_from_359_5_to_0():
    values = [0.0] * 720
    values[719] = 2.0
    values[0] = 4.0
    p = _profile(values)
    assert horizon_at(p, 359.75) == pytest.approx(3.0)
    assert horizon_at(p.to_dict(), 359.75) == pytest.approx(3.0)


@pytest.mark.parametrize("height", [2.0, 10.0])
def test_catalogue_site_at_2_or_10_m_uses_terrain_file(height):
    assert profile_path(SITE, height).is_file()
    p = get_horizon_profile(LAT, LON, height, site_id=SITE)
    assert p.method == "terrain"
    assert p.validity == "DERIVED"
    assert p.mast_height_m == height
    assert p.site_id == SITE


@pytest.mark.parametrize("height", [0.0, 1.0, 5.0, 2.5, 20.0])
def test_other_heights_use_sphere(height):
    p = get_horizon_profile(LAT, LON, height, site_id=SITE)
    assert p.method == "sphere"
    assert p.validity == "SYNTHETIC"
    assert p.mast_height_m == height
    assert p.horizon_deg[0] == pytest.approx(-horizon_dip_deg(height))


def test_custom_coordinate_uses_sphere():
    p = get_horizon_profile(LAT, LON, 2.0)
    assert p.method == "sphere"
    assert p.site_id is None


def test_site_without_file_uses_sphere():
    p = get_horizon_profile(0.67416, 23.47314, 2.0, site_id="apollo-11")
    assert p.method == "sphere"
    assert p.site_id == "apollo-11"


def test_negative_height_rejected():
    with pytest.raises(ValueError):
        get_horizon_profile(LAT, LON, -0.1, site_id=SITE)


def test_custom_horizons_dir(tmp_path):
    data = get_horizon_profile(LAT, LON, 3.0).to_dict()
    data.update(site_id="x", mast_height_m=2.0, method="terrain", validity="DERIVED")
    (tmp_path / "x_2m.json").write_text(json.dumps(data), encoding="utf-8")
    p = get_horizon_profile(LAT, LON, 2, site_id="x", horizons_dir=tmp_path)
    assert p.method == "terrain"


def test_profile_file_names():
    assert profile_path(SITE, 2.0) == HORIZONS_DIR / f"{SITE}_2m.json"
    assert profile_path(SITE, 10.0) == HORIZONS_DIR / f"{SITE}_10m.json"


def test_to_dict_has_contract_fields():
    d = get_horizon_profile(LAT, LON, 2.0).to_dict()
    assert set(d) == {
        "site_id", "lat_deg", "lon_deg", "mast_height_m", "azimuth_step_deg",
        "horizon_deg", "method", "max_range_km", "dem", "validity",
    }
