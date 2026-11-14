"""``GET /api/horizon``: the horizon profile of a site or a custom coordinate.

A catalogue site at 2 or 10 m gets its precomputed terrain profile from
``data/horizons/`` when the file exists; every other case gets the flat
(sphere) horizon with the ``SYNTHETIC`` label (ADR-0003, mast height rule;
ADR-0004, "Veri yoksa davranış").
"""

from __future__ import annotations

import math

from fastapi import APIRouter, Query

from app.core import location
from app.errors import DataUnavailable, InvalidParameter
from app.settings import get_settings
from app.terrain.horizon import get_horizon_profile

router = APIRouter(tags=["terrain"])

DEFAULT_MAST_HEIGHT_M = 2.0


@router.get("/horizon")
def horizon(
    site_id: str | None = Query(default=None),
    lat_deg: float | None = Query(default=None),
    lon_deg: float | None = Query(default=None),
    mast_height_m: float = Query(default=DEFAULT_MAST_HEIGHT_M),
) -> dict:
    """Return the ``HorizonProfile`` for the location and mast height."""

    if not math.isfinite(mast_height_m) or mast_height_m < 0:
        raise InvalidParameter(
            f"Invalid parameter 'mast_height_m': must be a finite number >= 0, got {mast_height_m}."
        )
    place = location.resolve(site_id, lat_deg, lon_deg)

    try:
        profile = get_horizon_profile(
            place.lat_deg,
            place.lon_deg,
            mast_height_m,
            place.site_id,
            horizons_dir=get_settings().data_dir / "horizons",
        )
    except (OSError, ValueError, KeyError) as exc:
        raise DataUnavailable(
            f"Horizon profile for '{place.site_id}' at {mast_height_m:g} m is not available."
        ) from exc
    return profile.to_dict()
