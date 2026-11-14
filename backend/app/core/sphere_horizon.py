"""Temporary flat-horizon provider based on a spherical Moon.

This module is the temporary flat-horizon provider used until
``app.terrain.horizon`` (F2-A) replaces it. It mirrors that interface: the same
``get_horizon_profile`` / ``horizon_at`` signatures and the same HorizonProfile
dict shape, so callers can switch providers without changes.
"""

from __future__ import annotations

import math

from app.errors import InvalidParameter

AZIMUTH_STEP_DEG = 0.5
N_AZIMUTHS = 720

MOON_RADIUS_M = 1737400.0


def sphere_dip_deg(mast_height_m: float) -> float:
    """Return the horizon dip in degrees for an observer at ``mast_height_m``."""

    if mast_height_m <= 0.0:
        return 0.0
    return -math.degrees(math.acos(MOON_RADIUS_M / (MOON_RADIUS_M + mast_height_m)))


def get_horizon_profile(
    lat_deg: float,
    lon_deg: float,
    mast_height_m: float,
    site_id: str | None = None,
) -> dict:
    """Return a synthetic HorizonProfile dict for a flat spherical horizon."""

    if mast_height_m < 0.0:
        raise InvalidParameter(
            f"Invalid parameter 'mast_height_m': must be >= 0, got {mast_height_m}."
        )

    dip = sphere_dip_deg(mast_height_m)
    return {
        "lat_deg": lat_deg,
        "lon_deg": lon_deg,
        "site_id": site_id,
        "mast_height_m": mast_height_m,
        "azimuth_step_deg": AZIMUTH_STEP_DEG,
        "horizon_deg": [dip] * N_AZIMUTHS,
        "method": "sphere",
        "max_range_km": None,
        "dem": None,
        "validity": "SYNTHETIC",
    }


def horizon_at(profile: dict, azimuth_deg: float) -> float:
    """Return the horizon elevation at ``azimuth_deg`` by linear interpolation."""

    horizon = profile["horizon_deg"]
    step = profile["azimuth_step_deg"]
    count = len(horizon)

    position = (azimuth_deg % 360.0) / step
    index = int(math.floor(position))
    fraction = position - index
    index %= count
    next_index = (index + 1) % count

    return horizon[index] + (horizon[next_index] - horizon[index]) * fraction
