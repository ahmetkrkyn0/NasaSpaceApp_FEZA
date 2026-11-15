"""``GET /api/body-series``: sub-solar and sub-Earth points on the Moon over time."""

from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from app.core import ephemeris
from app.errors import InvalidParameter
from app.models.bodies import BodySample, BodySeries

router = APIRouter(tags=["bodies"])

DEFAULT_STEP_S = 3600
MIN_STEP_S = 60
MAX_HOURS = 24 * 60
MAX_SAMPLES = 10_000
ANGLE_DECIMALS = 6
DISTANCE_DECIMALS = 3


def _sample_times(start: datetime, end: datetime, step_s: int) -> list[datetime]:
    """Every ``step_s`` from ``start``; ``end`` is always the last sample (ADR-0004).

    When the range is not a whole number of steps the last interval is shorter.
    """

    step = timedelta(seconds=step_s)
    times = [start]
    while times[-1] + step < end - timedelta(microseconds=1):
        times.append(times[-1] + step)
    if end > times[-1]:
        times.append(end)
    return times


def _resolve_times(
    utc: str | None, start_utc: str | None, end_utc: str | None, step_s: int | None
) -> list[datetime]:
    """Turn the query into sample times, enforcing the ADR-0004 bounds."""

    if utc is not None:
        if start_utc is not None or end_utc is not None or step_s is not None:
            raise InvalidParameter(
                "Invalid parameter 'utc': give either 'utc' alone or "
                "'start_utc' and 'end_utc' (with optional 'step_s'), not both."
            )
        return [ephemeris.parse_utc(utc, "utc")]

    if start_utc is None:
        raise InvalidParameter("Invalid parameter 'start_utc': required unless 'utc' is given.")
    if end_utc is None:
        raise InvalidParameter("Invalid parameter 'end_utc': required unless 'utc' is given.")
    start = ephemeris.parse_utc(start_utc, "start_utc")
    end = ephemeris.parse_utc(end_utc, "end_utc")

    step = DEFAULT_STEP_S if step_s is None else step_s
    if step < MIN_STEP_S:
        raise InvalidParameter(
            f"Invalid parameter 'step_s': must be >= {MIN_STEP_S}, got {step}."
        )
    if end < start:
        raise InvalidParameter(
            "Invalid parameter 'end_utc': must not be earlier than 'start_utc'."
        )
    if end - start > timedelta(hours=MAX_HOURS):
        raise InvalidParameter(
            f"Invalid parameter 'end_utc': the range must be at most {MAX_HOURS} hours."
        )
    count = int((end - start).total_seconds() // step) + 2
    if count > MAX_SAMPLES:
        raise InvalidParameter(
            f"Invalid parameter 'step_s': the range would give more than {MAX_SAMPLES} "
            "samples; use a larger step."
        )
    return _sample_times(start, end, step)


@router.get("/body-series", response_model=BodySeries)
def body_series(
    utc: str | None = Query(default=None),
    start_utc: str | None = Query(default=None),
    end_utc: str | None = Query(default=None),
    step_s: int | None = Query(default=None),
) -> BodySeries:
    """Return the sub-solar and sub-Earth points from ``start_utc`` to ``end_utc``, both ends included."""

    times = _resolve_times(utc, start_utc, end_utc, step_s)
    points = ephemeris.sub_points(times)

    samples = [
        BodySample(
            utc=ephemeris.format_utc(moment),
            sub_solar_lat_deg=round(point.sub_solar_lat_deg, ANGLE_DECIMALS),
            sub_solar_lon_deg=round(point.sub_solar_lon_deg, ANGLE_DECIMALS),
            sub_earth_lat_deg=round(point.sub_earth_lat_deg, ANGLE_DECIMALS),
            sub_earth_lon_deg=round(point.sub_earth_lon_deg, ANGLE_DECIMALS),
            earth_distance_km=round(point.earth_distance_km, DISTANCE_DECIMALS),
        )
        for moment, point in zip(times, points)
    ]
    return BodySeries(frame="MOON_ME", samples=samples, validity="DERIVED")
