"""Tests for app.core.sphere_horizon."""

from __future__ import annotations

import pytest

from app.core.sphere_horizon import (
    AZIMUTH_STEP_DEG,
    N_AZIMUTHS,
    get_horizon_profile,
    horizon_at,
    sphere_dip_deg,
)
from app.errors import InvalidParameter

PROFILE_KEYS = {
    "lat_deg",
    "lon_deg",
    "site_id",
    "mast_height_m",
    "azimuth_step_deg",
    "horizon_deg",
    "method",
    "max_range_km",
    "dem",
    "validity",
}


def _hand_made_profile() -> dict:
    return {
        "azimuth_step_deg": 0.5,
        "horizon_deg": [float(index) for index in range(720)],
    }


def test_constants() -> None:
    assert AZIMUTH_STEP_DEG == 0.5
    assert N_AZIMUTHS == 720


def test_dip_at_zero_height_is_zero() -> None:
    assert sphere_dip_deg(0) == 0.0


def test_dip_at_two_metres() -> None:
    assert sphere_dip_deg(2) == pytest.approx(-0.087, abs=0.002)


def test_dip_grows_with_height() -> None:
    assert sphere_dip_deg(10) < sphere_dip_deg(2)


def test_profile_has_all_keys() -> None:
    profile = get_horizon_profile(-84.7906, 29.1957, 2.0, site_id="athena")
    assert set(profile.keys()) == PROFILE_KEYS


def test_profile_values() -> None:
    profile = get_horizon_profile(-84.7906, 29.1957, 2.0, site_id="athena")
    assert profile["lat_deg"] == pytest.approx(-84.7906)
    assert profile["lon_deg"] == pytest.approx(29.1957)
    assert profile["site_id"] == "athena"
    assert profile["mast_height_m"] == pytest.approx(2.0)
    assert profile["azimuth_step_deg"] == pytest.approx(0.5)
    assert profile["method"] == "sphere"
    assert profile["validity"] == "SYNTHETIC"
    assert profile["max_range_km"] is None
    assert profile["dem"] is None


def test_profile_horizon_has_720_entries_all_equal_to_dip() -> None:
    profile = get_horizon_profile(-84.7906, 29.1957, 2.0)
    horizon = profile["horizon_deg"]
    assert len(horizon) == 720
    dip = sphere_dip_deg(2.0)
    for value in horizon:
        assert value == pytest.approx(dip)


def test_profile_site_id_defaults_to_none() -> None:
    profile = get_horizon_profile(0.0, 0.0, 2.0)
    assert profile["site_id"] is None


def test_negative_mast_height_is_rejected() -> None:
    with pytest.raises(InvalidParameter):
        get_horizon_profile(-84.7906, 29.1957, -1.0)


def test_horizon_at_interpolates_between_neighbours() -> None:
    profile = _hand_made_profile()
    # 0.25 deg sits halfway between index 0 (0.0) and index 1 (1.0)
    assert horizon_at(profile, 0.25) == pytest.approx(0.5)


def test_horizon_at_wraps_full_circle() -> None:
    profile = _hand_made_profile()
    assert horizon_at(profile, 360.0) == pytest.approx(0.0)


def test_horizon_at_wraps_last_entry_to_first() -> None:
    profile = _hand_made_profile()
    # 359.75 deg sits halfway between index 719 (719.0) and index 0 (0.0)
    assert horizon_at(profile, 359.75) == pytest.approx(359.5)


def test_horizon_at_negative_azimuth_wraps() -> None:
    profile = _hand_made_profile()
    assert horizon_at(profile, -0.5) == pytest.approx(719.0)
