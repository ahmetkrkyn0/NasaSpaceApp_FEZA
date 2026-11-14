"""``GET /api/now``: what is up at an instant and how long until it changes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from app.core import events, location, now, params
from app.models.events import NowStatus

router = APIRouter(tags=["events"])


def now_payload(status: dict[str, Any], mast_height_m: float) -> dict[str, Any]:
    """Format a core ``now_status`` result as ``NowStatus`` fields."""

    hours = ("hours_to_sunset", "hours_to_sunrise", "hours_to_earthset", "hours_to_earthrise", "night_hours")
    payload = dict(status)
    payload["utc"] = params.utc_or_none(status["utc"])
    for key in hours:
        payload[key] = params.rounded(status[key], 2)
    payload["mast_height_m"] = mast_height_m
    return payload


@router.get("/now", response_model=NowStatus)
def get_now(
    site_id: str | None = Query(default=None),
    lat_deg: float | None = Query(default=None),
    lon_deg: float | None = Query(default=None),
    mast_height_m: float | None = Query(default=None),
    utc: str | None = Query(default=None),
    earth_criterion: str | None = Query(default=None),
) -> NowStatus:
    """Sun and Earth state at ``utc``; a duration is ``null`` when not found within the search."""

    mast = params.resolve_mast_height(params.check_mast_height(mast_height_m))
    criterion = params.check_criterion(earth_criterion)
    place = location.resolve(site_id, lat_deg, lon_deg)
    moment = params.parse_time("utc", utc)

    status = now.now_status(events.observer_for(place, mast), moment, criterion)
    return NowStatus(**now_payload(status, mast))
