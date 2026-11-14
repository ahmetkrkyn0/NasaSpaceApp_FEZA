"""``GET /api/eclipses``: Earth covering the Sun over a range (tutulmalar.md)."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.events import event_payload
from app.core import eclipse, events, location, params
from app.models.events import EventList

router = APIRouter(tags=["events"])

_NO_METRICS = {
    "sunlit_fraction": None,
    "longest_dark_hours": None,
    "max_sun_elevation_deg": None,
    "earth_visible_fraction": None,
    "longest_earth_hidden_hours": None,
}


@router.get("/eclipses", response_model=EventList, response_model_exclude_unset=True)
def get_eclipses(
    site_id: str | None = Query(default=None),
    lat_deg: float | None = Query(default=None),
    lon_deg: float | None = Query(default=None),
    mast_height_m: float | None = Query(default=None),
    start_utc: str | None = Query(default=None),
    end_utc: str | None = Query(default=None),
) -> EventList:
    """``eclipse_start`` and ``eclipse_end`` events in ``[start_utc, end_utc]``; the same events appear in ``/api/events``."""

    mast = params.resolve_mast_height(params.check_mast_height(mast_height_m))
    place = location.resolve(site_id, lat_deg, lon_deg)
    start = params.parse_time("start_utc", start_utc)
    end = params.parse_time("end_utc", end_utc)
    params.check_interval(start, end)

    observer = events.observer_for(place, mast)
    found = eclipse.eclipse_events(eclipse.find_eclipses(observer, start, end))
    return EventList(
        events=[event_payload(e) for e in found],
        windows=[],
        metrics=dict(_NO_METRICS),
        mast_height_m=mast,
        validity=observer.validity,
    )
