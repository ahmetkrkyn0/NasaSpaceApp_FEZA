"""``GET /api/ground-stations`` and ``GET /api/earth-link``: Earth side of the direct link (#97, 4.2)."""

from __future__ import annotations

import math
from datetime import datetime

from fastapi import APIRouter, Query

from app.core import events, ephemeris, location, params, stations
from app.errors import InvalidParameter
from app.models.earth_link import EarthLink, GroundStation, LinkWindow, StationView, TimeWindow

router = APIRouter(tags=["earth-link"])

FRACTION_DECIMALS = 4


def _check_min_elevation(value: float | None) -> float | None:
    """``None`` passes through (assumed default); otherwise 0 <= value < 90."""

    if value is None:
        return None
    if not math.isfinite(value) or not 0.0 <= value < 90.0:
        raise InvalidParameter(
            f"Invalid parameter 'min_station_elevation_deg': must be >= 0 and < 90, got {value}."
        )
    return float(value)


def _window(start: datetime, end: datetime) -> TimeWindow:
    return TimeWindow(start_utc=ephemeris.format_utc(start), end_utc=ephemeris.format_utc(end))


@router.get("/ground-stations", response_model=list[GroundStation])
def get_ground_stations() -> list[GroundStation]:
    """The Deep Space Network complexes used for ``/api/earth-link``, with coordinate sources."""

    return stations.load_stations()


@router.get("/earth-link", response_model=EarthLink)
def get_earth_link(
    site_id: str | None = Query(default=None),
    lat_deg: float | None = Query(default=None),
    lon_deg: float | None = Query(default=None),
    mast_height_m: float | None = Query(default=None),
    start_utc: str | None = Query(default=None),
    end_utc: str | None = Query(default=None),
    min_station_elevation_deg: float | None = Query(default=None),
    earth_criterion: str | None = Query(default=None),
) -> EarthLink:
    """Station windows and link windows (``direct``, ``relay_needed``, ``no_station``) over the range."""

    mast = params.resolve_mast_height(params.check_mast_height(mast_height_m))
    criterion = params.check_criterion(earth_criterion)
    threshold = _check_min_elevation(min_station_elevation_deg)
    place = location.resolve(site_id, lat_deg, lon_deg)
    start = params.parse_time("start_utc", start_utc)
    end = params.parse_time("end_utc", end_utc)
    params.check_interval(start, end)

    result = stations.earth_link(events.observer_for(place, mast), start, end, criterion, threshold)
    return EarthLink(
        min_station_elevation_deg=result["min_station_elevation_deg"],
        stations=[
            StationView(
                id=view["id"],
                name=view["name"],
                in_view_fraction=round(view["in_view_fraction"], FRACTION_DECIMALS),
                windows=[_window(lo, hi) for lo, hi in view["windows"]],
            )
            for view in result["stations"]
        ],
        link_windows=[
            LinkWindow(
                start_utc=ephemeris.format_utc(window["start_utc"]),
                end_utc=ephemeris.format_utc(window["end_utc"]),
                mode=window["mode"],
                station_ids=window["station_ids"],
            )
            for window in result["link_windows"]
        ],
        assumptions=result["assumptions"],
        validity=result["validity"],
    )
