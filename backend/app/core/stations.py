"""Earth ground stations and direct-to-Earth link windows (#99; iletisim-penceresi.md, section 4).

A direct link needs two things at once: Earth above the site's horizon (the
same calculation as ``/api/events``) and the Moon above the minimum elevation
at one or more Deep Space Network complexes. Station view is computed for the
Moon's centre, not for the site; the 1737 km offset is below 0.3 degrees as
seen from Earth.

Station windows are found like the site events: a coarse grid, then
bisection with a fresh SPICE position at every step down to one second.
Relay satellites are not modelled; ``relay_needed`` only says that the site
has no direct view of Earth.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Callable

from pydantic import ValidationError

from app.core import catalog, ephemeris
from app.core.events import BISECT_TOLERANCE_S, BodyTrack, Crossing, Observer, grid
from app.errors import DataUnavailable
from app.models.common import lowest_validity
from app.models.earth_link import GroundStation

DEFAULT_MIN_ELEVATION_DEG = 10.0
"""Assumed. DSN 810-005, module 301: mechanical limit about 6 degrees, uplink from 10.1 degrees."""

STATION_STEP_MINUTES = 10.0
"""Coarse grid for station windows; a pass shorter than this can be missed."""

Interval = tuple[datetime, datetime]

_CRITERION_TEXT = {
    "center": "its centre",
    "first_limb": "any part of its disk",
    "full_disk": "its whole disk",
}


def load_stations() -> list[GroundStation]:
    """Station records from ``ground_stations.json``; a malformed file is ``DataUnavailable``."""

    try:
        return [GroundStation.model_validate(record) for record in catalog.load_ground_stations()]
    except ValidationError:
        raise DataUnavailable(f"Data file {catalog.GROUND_STATIONS_FILE} is not available.") from None


def _crossings(
    times: list[datetime],
    states: list[bool],
    state_at: Callable[[datetime], bool],
) -> list[Crossing]:
    """Every change of ``states`` on the grid, refined by bisection to one second."""

    found: list[Crossing] = []
    for i in range(len(states) - 1):
        if states[i] == states[i + 1]:
            continue
        lo, hi = times[i], times[i + 1]
        while (hi - lo).total_seconds() > BISECT_TOLERANCE_S:
            mid = lo + (hi - lo) / 2
            if state_at(mid) == states[i]:
                lo = mid
            else:
                hi = mid
        instant = lo + (hi - lo) / 2
        found.append(Crossing(utc=instant.replace(microsecond=0), rising=not states[i]))
    return found


def _true_intervals(state: bool, crossings: list[Crossing], start: datetime, end: datetime) -> list[Interval]:
    """Intervals of ``[start, end]`` where the state is true, cut at the ends."""

    intervals: list[Interval] = []
    edge = start
    for crossing in crossings:
        moment = min(max(crossing.utc, start), end)
        if state and moment > edge:
            intervals.append((edge, moment))
        edge = max(edge, moment)
        state = crossing.rising
    if state and end > edge:
        intervals.append((edge, end))
    return intervals


def station_windows(
    station: GroundStation,
    start: datetime,
    end: datetime,
    min_elevation_deg: float,
    step_minutes: float = STATION_STEP_MINUTES,
) -> list[Interval]:
    """When the Moon's centre is above ``min_elevation_deg`` at ``station``."""

    def elevations(moments: list[datetime]) -> list[float]:
        return ephemeris.moon_elevations_from_earth(
            station.lat_deg, station.lon_deg, station.elevation_m, moments
        )

    def in_view(moment: datetime) -> bool:
        return elevations([moment])[0] > min_elevation_deg

    times = grid(start, end, step_minutes)
    states = [value > min_elevation_deg for value in elevations(times)]
    return _true_intervals(states[0], _crossings(times, states, in_view), start, end)


def site_earth_windows(observer: Observer, start: datetime, end: datetime, earth_criterion: str) -> list[Interval]:
    """When Earth is visible from the site: the ``/api/events`` calculation, same horizon and criterion."""

    track = BodyTrack(observer, "EARTH", earth_criterion, grid(start, end))
    return _true_intervals(track.visible_at(0), track.crossings(), start, end)


def _inside(intervals: list[Interval], moment: datetime) -> bool:
    return any(lo <= moment < hi for lo, hi in intervals)


def link_windows(
    start: datetime,
    end: datetime,
    earth_visible: list[Interval],
    stations: dict[str, list[Interval]],
) -> list[dict[str, Any]]:
    """Cover ``[start, end]`` with link modes, without gaps or overlaps.

    ``relay_needed``: Earth is below the site's horizon. ``direct``: Earth is
    up and at least one station sees the Moon. ``no_station``: Earth is up but
    no station sees the Moon. Neighbouring stretches with the same mode are
    joined; a ``direct`` window lists every station that sees the Moon during
    it, in order of first appearance (``stations`` order on ties).
    """

    edges = {start, end}
    for lo, hi in earth_visible:
        edges.update((lo, hi))
    for intervals in stations.values():
        for lo, hi in intervals:
            edges.update((lo, hi))
    ordered = sorted(edge for edge in edges if start <= edge <= end)

    windows: list[dict[str, Any]] = []
    for lo, hi in zip(ordered, ordered[1:]):
        middle = lo + (hi - lo) / 2
        if not _inside(earth_visible, middle):
            mode, ids = "relay_needed", []
        else:
            ids = [station_id for station_id, intervals in stations.items() if _inside(intervals, middle)]
            mode = "direct" if ids else "no_station"
        if windows and windows[-1]["mode"] == mode:
            windows[-1]["end_utc"] = hi
            windows[-1]["station_ids"].extend(i for i in ids if i not in windows[-1]["station_ids"])
        else:
            windows.append({"start_utc": lo, "end_utc": hi, "mode": mode, "station_ids": ids})
    return windows


def _fraction(intervals: list[Interval], total_seconds: float) -> float:
    return sum((hi - lo).total_seconds() for lo, hi in intervals) / total_seconds


def _assumptions(observer: Observer, earth_criterion: str, min_elevation_deg: float, assumed: bool) -> list[str]:
    notes = [
        "Station view is computed for the Moon's centre, not for the site.",
        f"Earth counts as visible from the site when {_CRITERION_TEXT[earth_criterion]} is above "
        f"the horizon (earth_criterion={earth_criterion}), as in /api/events.",
    ]
    if observer.profile.method == "sphere":
        notes.append("The site horizon is a smooth sphere: terrain is not modelled.")
    if assumed:
        notes.append(
            f"The minimum station elevation ({min_elevation_deg:g} degrees) is assumed. DSN 810-005, "
            "module 301 gives about 6 degrees as the antenna's mechanical limit and 10.1 degrees as "
            "the lowest elevation for uplink."
        )
    else:
        notes.append(f"The minimum station elevation ({min_elevation_deg:g} degrees) is the requested value.")
    notes += [
        "Earth's rotation uses the IAU_EARTH model (no nutation, no UT1 correction): the Moon's "
        "elevation at a station is within 0.1 degrees of JPL Horizons, and station window edges "
        "move by well under a minute.",
        "No atmospheric refraction at the stations.",
        f"Station windows are searched on a {STATION_STEP_MINUTES:g}-minute grid and refined to one "
        "second; a pass shorter than the grid step can be missed.",
        "No relay satellite is modelled: relay_needed only says that there is no direct view.",
    ]
    return notes


def earth_link(
    observer: Observer,
    start: datetime,
    end: datetime,
    earth_criterion: str = "center",
    min_elevation_deg: float | None = None,
) -> dict[str, Any]:
    """Station windows and link windows over ``[start, end]`` (an ``EarthLink`` without serialisation).

    Times are datetimes and fractions unrounded; the API layer formats them.
    ``min_elevation_deg`` ``None`` means the assumed default.
    """

    assumed = min_elevation_deg is None
    threshold = DEFAULT_MIN_ELEVATION_DEG if assumed else float(min_elevation_deg)
    stations = load_stations()
    total = (end - start).total_seconds()

    earth_visible = site_earth_windows(observer, start, end, earth_criterion)
    windows = {station.id: station_windows(station, start, end, threshold) for station in stations}

    return {
        "min_station_elevation_deg": threshold,
        "stations": [
            {
                "id": station.id,
                "name": station.name,
                "in_view_fraction": _fraction(windows[station.id], total),
                "windows": windows[station.id],
            }
            for station in stations
        ],
        "link_windows": link_windows(start, end, earth_visible, windows),
        "assumptions": _assumptions(observer, earth_criterion, threshold, assumed),
        "validity": lowest_validity("DERIVED", observer.validity),
    }
