"""``GET /api/sky-series``: Sun and Earth above the site's horizon over time."""

from __future__ import annotations

import math
from datetime import timedelta

from fastapi import APIRouter, Query

from app.core import ephemeris, location, sphere_horizon, visibility
from app.errors import InvalidParameter
from app.models.common import lowest_validity
from app.models.sky import (
    EarthSample,
    EphemerisInfo,
    HorizonInfo,
    SkySample,
    SkySeries,
    SunSample,
)

router = APIRouter(tags=["sky"])

DEFAULT_MAST_HEIGHT_M = 2.0
MAX_HOURS = 24 * 60
ANGLE_DECIMALS = 6


def _check_finite(name: str, value: float) -> None:
    if not math.isfinite(value):
        raise InvalidParameter(f"Invalid parameter '{name}': must be a finite number.")


def _validate_bounds(mast_height_m: float, hours: float, step_minutes: int) -> None:
    """Reject out-of-bounds numeric parameters (ADR-0004, "Sınırlar")."""

    _check_finite("mast_height_m", mast_height_m)
    _check_finite("hours", hours)
    if mast_height_m < 0:
        raise InvalidParameter(
            f"Invalid parameter 'mast_height_m': must be >= 0, got {mast_height_m}."
        )
    if not 0 <= hours <= MAX_HOURS:
        raise InvalidParameter(
            f"Invalid parameter 'hours': must be between 0 and {MAX_HOURS}, got {hours}."
        )
    if step_minutes < 1:
        raise InvalidParameter(
            f"Invalid parameter 'step_minutes': must be >= 1, got {step_minutes}."
        )


def _round(value: float) -> float:
    return round(value, ANGLE_DECIMALS)


@router.get("/sky-series", response_model=SkySeries)
def sky_series(
    site_id: str | None = Query(default=None),
    lat_deg: float | None = Query(default=None),
    lon_deg: float | None = Query(default=None),
    mast_height_m: float = Query(default=DEFAULT_MAST_HEIGHT_M),
    start_utc: str | None = Query(default=None),
    hours: float = Query(default=24.0),
    step_minutes: int = Query(default=60),
) -> SkySeries:
    """Return Sun and Earth positions from ``start_utc`` to ``start_utc + hours``, both ends included."""

    _validate_bounds(mast_height_m, hours, step_minutes)
    place = location.resolve(site_id, lat_deg, lon_deg)

    if start_utc is None:
        raise InvalidParameter("Invalid parameter 'start_utc': required.")
    start = ephemeris.parse_utc(start_utc, "start_utc")

    count = math.floor(hours * 60 / step_minutes + 1e-9) + 1
    times = [start + timedelta(minutes=k * step_minutes) for k in range(count)]

    height_m = (place.elevation_m or 0.0) + mast_height_m
    suns = ephemeris.body_positions(place.lat_deg, place.lon_deg, height_m, times, "SUN")
    earths = ephemeris.body_positions(place.lat_deg, place.lon_deg, height_m, times, "EARTH")

    profile = sphere_horizon.get_horizon_profile(
        place.lat_deg, place.lon_deg, mast_height_m, place.site_id
    )

    samples: list[SkySample] = []
    for moment, sun, earth in zip(times, suns, earths):
        sun_horizon = sphere_horizon.horizon_at(profile, sun.azimuth_true_deg)
        earth_horizon = sphere_horizon.horizon_at(profile, earth.azimuth_true_deg)
        samples.append(
            SkySample(
                utc=ephemeris.format_utc(moment),
                sun=SunSample(
                    azimuth_true_deg=_round(sun.azimuth_true_deg),
                    elevation_deg=_round(sun.elevation_deg),
                    horizon_deg=_round(sun_horizon),
                    visible_fraction=_round(
                        visibility.visible_fraction(sun.elevation_deg, sun_horizon, sun.radius_deg)
                    ),
                    range_au=round(sun.range_km / ephemeris.AU_KM, 9),
                    radius_deg=_round(sun.radius_deg),
                ),
                earth=EarthSample(
                    azimuth_true_deg=_round(earth.azimuth_true_deg),
                    elevation_deg=_round(earth.elevation_deg),
                    horizon_deg=_round(earth_horizon),
                    visible_fraction=_round(
                        visibility.visible_fraction(
                            earth.elevation_deg, earth_horizon, earth.radius_deg
                        )
                    ),
                    range_km=round(earth.range_km, 3),
                    radius_deg=_round(earth.radius_deg),
                ),
            )
        )

    return SkySeries(
        lat_deg=place.lat_deg,
        lon_deg=place.lon_deg,
        mast_height_m=mast_height_m,
        start_utc=ephemeris.format_utc(start),
        step_minutes=step_minutes,
        samples=samples,
        ephemeris=EphemerisInfo(**ephemeris.EPHEMERIS_INFO),
        horizon=HorizonInfo(method=profile["method"], validity=profile["validity"]),
        validity=lowest_validity("MODEL", profile["validity"]),
    )
