"""``GET /api/events``: rise and set events, windows and metrics over a range."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from app.core import events, location, params
from app.models.events import EventList

router = APIRouter(tags=["events"])


def metrics_payload(metrics: dict[str, Any]) -> dict[str, Any]:
    """Round the ``EventMetrics`` values for the response."""

    return {
        "sunlit_fraction": params.rounded(metrics["sunlit_fraction"], 4),
        "longest_dark_hours": params.rounded(metrics["longest_dark_hours"], 2),
        "max_sun_elevation_deg": params.rounded(metrics["max_sun_elevation_deg"], 4),
        "earth_visible_fraction": params.rounded(metrics["earth_visible_fraction"], 4),
        "longest_earth_hidden_hours": params.rounded(metrics["longest_earth_hidden_hours"], 2),
    }


@router.get("/events", response_model=EventList)
def get_events(
    site_id: str | None = Query(default=None),
    lat_deg: float | None = Query(default=None),
    lon_deg: float | None = Query(default=None),
    mast_height_m: float | None = Query(default=None),
    start_utc: str | None = Query(default=None),
    end_utc: str | None = Query(default=None),
    earth_criterion: str | None = Query(default=None),
) -> EventList:
    """Sunrise/sunset (first limb) and earthrise/earthset (``earth_criterion``) in ``[start_utc, end_utc]``."""

    mast = params.resolve_mast_height(params.check_mast_height(mast_height_m))
    criterion = params.check_criterion(earth_criterion)
    place = location.resolve(site_id, lat_deg, lon_deg)
    start = params.parse_time("start_utc", start_utc)
    end = params.parse_time("end_utc", end_utc)
    params.check_interval(start, end)

    result = events.compute_events(events.observer_for(place, mast), start, end, criterion)
    return EventList(
        events=[
            {
                "type": e["type"],
                "utc": params.utc_or_none(e["utc"]),
                "utc_earliest": params.utc_or_none(e["utc_earliest"]),
                "utc_latest": params.utc_or_none(e["utc_latest"]),
                "criterion": e["criterion"],
            }
            for e in result["events"]
        ],
        windows=[
            {
                "kind": w["kind"],
                "start_utc": params.utc_or_none(w["start_utc"]),
                "end_utc": params.utc_or_none(w["end_utc"]),
                "duration_hours": round(w["duration_hours"], 2),
            }
            for w in result["windows"]
        ],
        metrics=metrics_payload(result["metrics"]),
        mast_height_m=mast,
        validity=result["validity"],
    )
