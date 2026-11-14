"""State at a chosen instant: what is up, and how long until it changes (``NowStatus``)."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from app.core import ephemeris
from app.core.events import SUN_CRITERION, BodyTrack, Crossing, Observer, grid

SEARCH_HOURS = 720.0
"""Search ahead (and back, for the current night) about one synodic month (708.7 h)."""


def _clamp(moment: datetime) -> datetime:
    start, end = ephemeris.ephemeris_range()
    return min(max(moment, start), end)


def _hours(a: datetime, b: datetime) -> float:
    return (b - a).total_seconds() / 3600.0


def forward_track(observer: Observer, body: str, criterion: str, utc: datetime) -> BodyTrack:
    """Track from ``utc`` to ``utc + SEARCH_HOURS``; the first sample is ``utc`` itself."""

    end = _clamp(utc + timedelta(hours=SEARCH_HOURS))
    return BodyTrack(observer, body, criterion, grid(utc, end))  # type: ignore[arg-type]


def next_crossing(crossings: list[Crossing], utc: datetime, rising: bool | None = None) -> Crossing | None:
    """First crossing strictly after ``utc`` (optionally of one direction)."""

    for crossing in crossings:
        if crossing.utc > utc and (rising is None or crossing.rising == rising):
            return crossing
    return None


def now_status(observer: Observer, utc: datetime, earth_criterion: str) -> dict[str, Any]:
    """``NowStatus`` fields; durations in hours, ``None`` when not found within the search."""

    limited = False

    sun = forward_track(observer, "SUN", SUN_CRITERION, utc)
    sun_crossings = sun.crossings()
    sun_up = sun.visible_at(0)
    hours_to_sunset = hours_to_sunrise = night_hours = None

    if sun_up:
        sunset = next_crossing(sun_crossings, utc, rising=False)
        if sunset is None:
            limited = True
        else:
            hours_to_sunset = _hours(utc, sunset.utc)
            sunrise = next_crossing(sun_crossings, sunset.utc, rising=True)
            if sunrise is None:
                limited = True
            else:
                night_hours = _hours(sunset.utc, sunrise.utc)
    else:
        sunrise = next_crossing(sun_crossings, utc, rising=True)
        if sunrise is None:
            limited = True
        else:
            hours_to_sunrise = _hours(utc, sunrise.utc)
            back_start = _clamp(utc - timedelta(hours=SEARCH_HOURS))
            back = BodyTrack(observer, "SUN", SUN_CRITERION, grid(back_start, utc))
            sunsets = [c for c in back.crossings() if not c.rising]
            if sunsets:
                night_hours = _hours(sunsets[-1].utc, sunrise.utc)
            else:
                limited = True

    earth = forward_track(observer, "EARTH", earth_criterion, utc)
    earth_up = earth.visible_at(0)
    change = next_crossing(earth.crossings(), utc)
    hours_to_earthset = hours_to_earthrise = None
    if change is None:
        limited = True
    elif earth_up:
        hours_to_earthset = _hours(utc, change.utc)
    else:
        hours_to_earthrise = _hours(utc, change.utc)

    return {
        "utc": utc,
        "sun_up": sun_up,
        "hours_to_sunset": hours_to_sunset,
        "hours_to_sunrise": hours_to_sunrise,
        "earth_up": earth_up,
        "hours_to_earthset": hours_to_earthset,
        "hours_to_earthrise": hours_to_earthrise,
        "night_hours": night_hours,
        "criterion": earth_criterion,
        "search_limited": limited,
        "validity": observer.validity,
    }
