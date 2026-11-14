"""T4: flat horizon dip and distance (docs/PLAN.md, 4.2).

Expected values: dogrulama/ufuk-ve-isik-isi.md, No A-6 and A-7.
"""

import pytest

from app.terrain.horizon import horizon_dip_deg, horizon_distance_km, sphere_profile

T4 = [
    # mast height m, dip deg, distance km
    (1.0, 0.061, 1.86),
    (2.0, 0.087, 2.64),
    (5.0, 0.137, 4.17),
    (10.0, 0.194, 5.89),
]


@pytest.mark.parametrize("height, dip, distance", T4)
def test_t4_dip(height, dip, distance):
    assert horizon_dip_deg(height) == pytest.approx(dip, abs=0.001)


@pytest.mark.parametrize("height, dip, distance", T4)
def test_t4_distance(height, dip, distance):
    assert horizon_distance_km(height) == pytest.approx(distance, abs=0.01)


def test_zero_height_has_no_dip():
    assert horizon_dip_deg(0.0) == 0.0
    assert horizon_distance_km(0.0) == 0.0


def test_negative_height_rejected():
    with pytest.raises(ValueError):
        horizon_dip_deg(-1.0)
    with pytest.raises(ValueError):
        horizon_distance_km(-1.0)


def test_sphere_profile_is_720_equal_values():
    profile = sphere_profile(-84.78, 29.13, 2.0)
    assert len(profile.horizon_deg) == 720
    assert set(profile.horizon_deg) == {-horizon_dip_deg(2.0)}
    assert profile.method == "sphere"
    assert profile.validity == "SYNTHETIC"
    assert profile.dem is None
    assert profile.max_range_km is None
    assert profile.azimuth_step_deg == 0.5
