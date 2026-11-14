"""Rise and set events, windows and summary metrics (docs/design/olaylar-ve-sureler.md).

A body counts as visible while its *margin* is positive: elevation minus the
horizon angle in its direction, adjusted by the visibility criterion
(``center``: the disk centre, ``first_limb``: any part of the disk,
``full_disk``: the whole disk). Crossings are found on a coarse grid and then
refined by bisection with a fresh SPICE position at every step, down to one
second, so short events between grid points are not reported at grid times.

Each event is computed twice more with the horizon lowered and raised by one
arcminute; the two instants give ``utc_earliest`` and ``utc_latest``. This is a
sensitivity indicator, not a confidence interval (PLAN.md, section 12, decision 4).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Literal

from app.core import ephemeris
from app.core.ephemeris import BodyPosition
from app.core.location import Location
from app.errors import InvalidParameter
from app.models.common import lowest_validity
from app.terrain.horizon import HorizonProfile, get_horizon_profile, horizon_at

Body = Literal["SUN", "EARTH"]

SUN_CRITERION = "first_limb"
"""Sunrise counts from the first limb: power starts when part of the disk shows."""

ARCMIN_DEG = 1.0 / 60.0
COARSE_STEP_MINUTES = 30
BISECT_TOLERANCE_S = 1.0
MATCH_WINDOW = timedelta(hours=48)
"""How far a shifted-horizon event may lie from the nominal one and still be its pair."""

_LIMB_SIGN = {"center": 0.0, "first_limb": 1.0, "full_disk": -1.0}

_EVENT_TYPES = {
    ("SUN", True): "sunrise",
    ("SUN", False): "sunset",
    ("EARTH", True): "earthrise",
    ("EARTH", False): "earthset",
}
_WINDOW_KINDS = {
    ("SUN", True): "sunlit",
    ("SUN", False): "dark",
    ("EARTH", True): "earth_visible",
    ("EARTH", False): "earth_hidden",
}


@dataclass(frozen=True)
class Observer:
    """A point on the Moon with the horizon profile used for it."""

    lat_deg: float
    lon_deg: float
    height_m: float
    profile: HorizonProfile

    @property
    def validity(self) -> str:
        """Results inherit the horizon label; positions themselves are ``MODEL``."""

        return lowest_validity("MODEL", self.profile.validity)


def observer_for(location: Location, mast_height_m: float) -> Observer:
    """Observer at ``mast_height_m`` above the site, with the horizon from line B's provider.

    The provider applies the mast height rule: terrain profiles for catalogue
    sites at 2 and 10 m, the flat horizon (``SYNTHETIC``) everywhere else.
    """

    try:
        profile = get_horizon_profile(location.lat_deg, location.lon_deg, mast_height_m, location.site_id)
    except ValueError as exc:
        raise InvalidParameter(f"Invalid parameter 'mast_height_m': {exc}.") from None
    height_m = (location.elevation_m or 0.0) + mast_height_m
    return Observer(location.lat_deg, location.lon_deg, height_m, profile)


@dataclass(frozen=True)
class Crossing:
    """The instant a body becomes visible (``rising``) or hidden."""

    utc: datetime
    rising: bool


def margin_deg(position: BodyPosition, profile: HorizonProfile, criterion: str, offset_deg: float = 0.0) -> float:
    """How far the body is above the horizon under ``criterion``; positive means visible."""

    horizon = horizon_at(profile, position.azimuth_true_deg) + offset_deg
    return position.elevation_deg - horizon + _LIMB_SIGN[criterion] * position.radius_deg


def grid(start: datetime, end: datetime, step_minutes: float = COARSE_STEP_MINUTES) -> list[datetime]:
    """Times from ``start`` to ``end`` every ``step_minutes``; both ends included."""

    step = timedelta(minutes=step_minutes)
    times = []
    moment = start
    while moment < end:
        times.append(moment)
        moment += step
    times.append(end)
    return times


class BodyTrack:
    """Positions of one body on a time grid, with crossing search."""

    def __init__(self, observer: Observer, body: Body, criterion: str, times: list[datetime]) -> None:
        self.observer = observer
        self.body = body
        self.criterion = criterion
        self.times = times
        self.positions = ephemeris.body_positions(
            observer.lat_deg, observer.lon_deg, observer.height_m, times, body
        )

    def _position_at(self, moment: datetime) -> BodyPosition:
        obs = self.observer
        return ephemeris.body_positions(obs.lat_deg, obs.lon_deg, obs.height_m, [moment], self.body)[0]

    def margin(self, position: BodyPosition, offset_deg: float = 0.0) -> float:
        return margin_deg(position, self.observer.profile, self.criterion, offset_deg)

    def visible_at(self, index: int, offset_deg: float = 0.0) -> bool:
        return self.margin(self.positions[index], offset_deg) > 0.0

    def crossings(self, offset_deg: float = 0.0) -> list[Crossing]:
        """Every change of visibility on the grid, refined to one second."""

        found: list[Crossing] = []
        states = [self.margin(p, offset_deg) > 0.0 for p in self.positions]
        for i in range(len(states) - 1):
            if states[i] == states[i + 1]:
                continue
            lo, hi = self.times[i], self.times[i + 1]
            while (hi - lo).total_seconds() > BISECT_TOLERANCE_S:
                mid = lo + (hi - lo) / 2
                if (self.margin(self._position_at(mid), offset_deg) > 0.0) == states[i]:
                    lo = mid
                else:
                    hi = mid
            instant = lo + (hi - lo) / 2
            found.append(Crossing(utc=instant.replace(microsecond=0), rising=not states[i]))
        return found


def _nearest(crossings: list[Crossing], target: Crossing) -> datetime | None:
    candidates = [
        c.utc for c in crossings
        if c.rising == target.rising and abs(c.utc - target.utc) <= MATCH_WINDOW
    ]
    if not candidates:
        return None
    return min(candidates, key=lambda moment: abs(moment - target.utc))


def _hours(delta: timedelta) -> float:
    return delta.total_seconds() / 3600.0


def _windows(track: BodyTrack, crossings: list[Crossing], start: datetime, end: datetime) -> list[dict[str, Any]]:
    """Visibility windows between query ends and crossings; cut at the query ends."""

    windows = []
    state = track.visible_at(0)
    edge = start
    for crossing in crossings + [Crossing(utc=end, rising=not state)]:
        if crossing.utc > edge:
            windows.append({
                "kind": _WINDOW_KINDS[(track.body, state)],
                "start_utc": edge,
                "end_utc": crossing.utc,
                "duration_hours": _hours(crossing.utc - edge),
            })
        edge = crossing.utc
        state = crossing.rising
    return windows


def _event_dicts(track: BodyTrack, crossings: list[Crossing]) -> list[dict[str, Any]]:
    lowered = track.crossings(-ARCMIN_DEG)
    raised = track.crossings(+ARCMIN_DEG)
    events = []
    for crossing in crossings:
        shifted = [_nearest(lowered, crossing), _nearest(raised, crossing)]
        if None in shifted:
            earliest = latest = None
        else:
            earliest = min(shifted + [crossing.utc])
            latest = max(shifted + [crossing.utc])
        events.append({
            "type": _EVENT_TYPES[(track.body, crossing.rising)],
            "utc": crossing.utc,
            "utc_earliest": earliest,
            "utc_latest": latest,
            "criterion": track.criterion,
        })
    return events


def _fraction(windows: list[dict[str, Any]], kind: str, total_hours: float) -> float:
    return sum(w["duration_hours"] for w in windows if w["kind"] == kind) / total_hours


def _longest(windows: list[dict[str, Any]], kind: str) -> float:
    return max((w["duration_hours"] for w in windows if w["kind"] == kind), default=0.0)


def compute_events(
    observer: Observer,
    start: datetime,
    end: datetime,
    earth_criterion: str = "center",
    step_minutes: float = COARSE_STEP_MINUTES,
) -> dict[str, Any]:
    """Events, windows and metrics for ``[start, end]`` (an ``EventList`` without serialisation).

    Times are datetimes and durations unrounded; the API layer formats them.
    """

    times = grid(start, end, step_minutes)
    sun = BodyTrack(observer, "SUN", SUN_CRITERION, times)
    earth = BodyTrack(observer, "EARTH", earth_criterion, times)
    sun_crossings = sun.crossings()
    earth_crossings = earth.crossings()

    events = _event_dicts(sun, sun_crossings) + _event_dicts(earth, earth_crossings)
    events.sort(key=lambda event: event["utc"])
    sun_windows = _windows(sun, sun_crossings, start, end)
    earth_windows = _windows(earth, earth_crossings, start, end)
    windows = sorted(sun_windows + earth_windows, key=lambda w: (w["start_utc"], w["kind"]))

    total = _hours(end - start)
    metrics = {
        "sunlit_fraction": _fraction(sun_windows, "sunlit", total),
        "longest_dark_hours": _longest(sun_windows, "dark"),
        "max_sun_elevation_deg": max(p.elevation_deg for p in sun.positions),
        "earth_visible_fraction": _fraction(earth_windows, "earth_visible", total),
        "longest_earth_hidden_hours": _longest(earth_windows, "earth_hidden"),
    }
    return {"events": events, "windows": windows, "metrics": metrics, "validity": observer.validity}
