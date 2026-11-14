"""``GET /api/power``: panel power over a range."""

from __future__ import annotations

import math

from fastapi import APIRouter, Query

from app.core import events, location, params, power
from app.errors import InvalidParameter
from app.models.power import PowerSeries

router = APIRouter(tags=["power"])


@router.get("/power", response_model=PowerSeries)
def get_power(
    site_id: str | None = Query(default=None),
    lat_deg: float | None = Query(default=None),
    lon_deg: float | None = Query(default=None),
    mast_height_m: float | None = Query(default=None),
    start_utc: str | None = Query(default=None),
    end_utc: str | None = Query(default=None),
    panel_profile_id: str | None = Query(default=None),
    fixed_azimuth_deg: float | None = Query(default=None),
) -> PowerSeries:
    """Hourly power of ``panel_profile_id``. For ``vertical_fixed`` without ``fixed_azimuth_deg`` the best direction is used and reported."""

    requested_mast = params.check_mast_height(mast_height_m)
    if fixed_azimuth_deg is not None and not math.isfinite(fixed_azimuth_deg):
        raise InvalidParameter("Invalid parameter 'fixed_azimuth_deg': must be a finite number.")
    place = location.resolve(site_id, lat_deg, lon_deg)
    start = params.parse_time("start_utc", start_utc)
    end = params.parse_time("end_utc", end_utc)
    params.check_interval(start, end)
    panel = power.find_panel(panel_profile_id)
    mast = params.resolve_mast_height(requested_mast, panel)

    series = power.compute_power(events.observer_for(place, mast), start, end, panel, fixed_azimuth_deg)
    summary = series["summary"]
    return PowerSeries(
        panel_profile_id=series["panel_profile_id"],
        mast_height_m=mast,
        fixed_azimuth_deg=series["fixed_azimuth_deg"],
        samples=[
            {
                "utc": params.utc_or_none(s["utc"]),
                "incidence_cos": round(s["incidence_cos"], 6),
                "sun_visible_fraction": round(s["sun_visible_fraction"], 6),
                "irradiance_w_m2": round(s["irradiance_w_m2"], 2),
                "power_w": round(s["power_w"], 3),
            }
            for s in series["samples"]
        ],
        summary={
            "mean_power_w": params.rounded(summary["mean_power_w"], 2),
            "energy_kwh": params.rounded(summary["energy_kwh"], 3),
            "sunlit_fraction": params.rounded(summary["sunlit_fraction"], 4),
            "longest_dark_hours": params.rounded(summary["longest_dark_hours"], 2),
        },
        validity=series["validity"],
    )
