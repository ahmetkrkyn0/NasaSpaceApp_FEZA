"""``GET /api/comm-window``: direct-to-Earth visibility at an instant."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.core import comm, events, location, params
from app.models.events import CommWindow

router = APIRouter(tags=["events"])


@router.get("/comm-window", response_model=CommWindow)
def get_comm_window(
    site_id: str | None = Query(default=None),
    lat_deg: float | None = Query(default=None),
    lon_deg: float | None = Query(default=None),
    mast_height_m: float | None = Query(default=None),
    utc: str | None = Query(default=None),
    earth_criterion: str | None = Query(default=None),
) -> CommWindow:
    """Whether Earth is visible at ``utc`` (``earth_criterion``) and minutes until that changes."""

    mast = params.resolve_mast_height(params.check_mast_height(mast_height_m))
    criterion = params.check_criterion(earth_criterion)
    place = location.resolve(site_id, lat_deg, lon_deg)
    moment = params.parse_time("utc", utc)

    window = comm.comm_window(events.observer_for(place, mast), moment, criterion)
    return CommWindow(
        utc=params.utc_or_none(window["utc"]),
        lat_deg=place.lat_deg,
        lon_deg=place.lon_deg,
        mast_height_m=mast,
        visible_now=window["visible_now"],
        minutes_remaining=params.rounded(window["minutes_remaining"], 0),
        minutes_until_visible=params.rounded(window["minutes_until_visible"], 0),
        next_change_utc=params.utc_or_none(window["next_change_utc"]),
        search_limited=window["search_limited"],
        searched_hours=round(window["searched_hours"], 2),
        earth_elevation_deg=params.rounded(window["earth_elevation_deg"], 4),
        earth_azimuth_true_deg=params.rounded(window["earth_azimuth_true_deg"], 4),
        horizon_deg=round(window["horizon_deg"], 4),
        criterion=window["criterion"],
        validity=window["validity"],
    )
