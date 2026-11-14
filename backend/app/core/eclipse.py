"""Earth covering the Sun's disk as seen from a lunar site (docs/design/tutulmalar.md).

Seen from Earth the same alignment is a lunar eclipse. The covered share is
the area of the Sun's disk inside Earth's disk, from the apparent (``LT+S``)
directions and radii of both bodies. Earth is a sharp-edged disk (its
atmosphere is ignored) and the Sun's disk is uniformly bright (no limb
darkening), so the share is an area ratio, not a brightness ratio.

Start and end are searched like rise and set events (olaylar-ve-sureler.md):
a coarse grid, a refined closest approach, then bisection with fresh SPICE
positions down to one second. Horizon shifts do not move an eclipse, so its
events carry no sensitivity range.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

import numpy as np

from app.core import ephemeris
from app.core.ephemeris import BodyPosition

if TYPE_CHECKING:
    from app.core.events import Observer

CRITERION = "first_limb"
"""An eclipse lasts while any part of the Sun's disk is covered."""

DRIFT_DEG_PER_HOUR = 0.6
"""Upper bound of the Sun's motion relative to Earth in the lunar sky (about 0.5 deg/h)."""

GOLDEN = (math.sqrt(5.0) - 1.0) / 2.0
MERGE_WINDOW = timedelta(seconds=60)


def obscured_fraction(separation_deg: Any, sun_radius_deg: Any, earth_radius_deg: Any) -> Any:
    """Share of the Sun's disk area covered by Earth's disk; arrays in, arrays out."""

    scalar = all(np.ndim(v) == 0 for v in (separation_deg, sun_radius_deg, earth_radius_deg))
    d, rs, re = np.broadcast_arrays(
        np.asarray(separation_deg, dtype=float),
        np.asarray(sun_radius_deg, dtype=float),
        np.asarray(earth_radius_deg, dtype=float),
    )

    with np.errstate(divide="ignore", invalid="ignore"):
        safe_d = np.where(d > 0.0, d, 1.0)
        a1 = np.arccos(np.clip((safe_d**2 + rs**2 - re**2) / (2.0 * safe_d * rs), -1.0, 1.0))
        a2 = np.arccos(np.clip((safe_d**2 + re**2 - rs**2) / (2.0 * safe_d * re), -1.0, 1.0))
        kite = (-safe_d + rs + re) * (safe_d + rs - re) * (safe_d - rs + re) * (safe_d + rs + re)
        lens = rs**2 * a1 + re**2 * a2 - 0.5 * np.sqrt(np.clip(kite, 0.0, None))
        partial = lens / (np.pi * rs**2)

    fraction = np.where(
        d >= rs + re,
        0.0,
        np.where(
            d <= re - rs,
            1.0,
            np.where(d <= rs - re, (re / rs) ** 2, partial),
        ),
    )
    fraction = np.clip(fraction, 0.0, 1.0)
    return float(fraction) if scalar else fraction


def angular_separation_deg(az1_deg: Any, el1_deg: Any, az2_deg: Any, el2_deg: Any) -> Any:
    """Angle between two sky directions given as azimuth and elevation; arrays in, arrays out."""

    scalar = all(np.ndim(v) == 0 for v in (az1_deg, el1_deg, az2_deg, el2_deg))
    az1, el1, az2, el2 = (np.radians(np.asarray(v, dtype=float)) for v in (az1_deg, el1_deg, az2_deg, el2_deg))
    dot = (
        np.cos(el1) * np.sin(az1) * np.cos(el2) * np.sin(az2)
        + np.cos(el1) * np.cos(az1) * np.cos(el2) * np.cos(az2)
        + np.sin(el1) * np.sin(el2)
    )
    angle = np.degrees(np.arccos(np.clip(dot, -1.0, 1.0)))
    return float(angle) if scalar else angle


@dataclass(frozen=True)
class Eclipse:
    """One eclipse; ``None`` ends mean it was running at the start or end of the range."""

    start_utc: datetime | None
    end_utc: datetime | None
    max_utc: datetime
    max_obscured_fraction: float


def _overlap_margin(sun: BodyPosition, earth: BodyPosition) -> float:
    """Separation minus the sum of the radii; negative while the disks overlap."""

    separation = angular_separation_deg(
        sun.azimuth_true_deg, sun.elevation_deg, earth.azimuth_true_deg, earth.elevation_deg
    )
    return separation - (sun.radius_deg + earth.radius_deg)


class _Geometry:
    """Fresh Sun and Earth positions for one observer."""

    def __init__(self, observer: Observer) -> None:
        self.observer = observer

    def pair(self, moment: datetime) -> tuple[BodyPosition, BodyPosition]:
        obs = self.observer
        sun = ephemeris.body_positions(obs.lat_deg, obs.lon_deg, obs.height_m, [moment], "SUN")[0]
        earth = ephemeris.body_positions(obs.lat_deg, obs.lon_deg, obs.height_m, [moment], "EARTH")[0]
        return sun, earth

    def margin(self, moment: datetime) -> float:
        return _overlap_margin(*self.pair(moment))

    def closest(self, lo: datetime, hi: datetime, tolerance_s: float) -> datetime:
        """Golden-section search for the smallest margin in ``[lo, hi]``."""

        a, b = lo, hi
        c = b - (b - a) * GOLDEN
        d = a + (b - a) * GOLDEN
        mc, md = self.margin(c), self.margin(d)
        while (b - a).total_seconds() > tolerance_s:
            if mc < md:
                b, d, md = d, c, mc
                c = b - (b - a) * GOLDEN
                mc = self.margin(c)
            else:
                a, c, mc = c, d, md
                d = a + (b - a) * GOLDEN
                md = self.margin(d)
        return a + (b - a) / 2

    def crossing(self, outside: datetime, inside: datetime, tolerance_s: float) -> datetime:
        """Instant the margin changes sign between ``outside`` (>= 0) and ``inside`` (< 0)."""

        while abs((inside - outside).total_seconds()) > tolerance_s:
            mid = outside + (inside - outside) / 2
            if self.margin(mid) < 0.0:
                inside = mid
            else:
                outside = mid
        return (outside + (inside - outside) / 2).replace(microsecond=0)


def find_eclipses(
    observer: Observer,
    start: datetime,
    end: datetime,
    times: list[datetime] | None = None,
    sun: list[BodyPosition] | None = None,
    earth: list[BodyPosition] | None = None,
    step_minutes: float | None = None,
) -> list[Eclipse]:
    """Eclipses in ``[start, end]`` while the Sun is above the site's horizon.

    ``times``, ``sun`` and ``earth`` are an optional precomputed grid with its
    positions (``compute_events`` passes its tracks). An eclipse whose closest
    approach falls while the Sun is below the horizon is not reported: it
    does not change the light at the site.
    """

    from app.core import events

    step = events.COARSE_STEP_MINUTES if step_minutes is None else step_minutes
    if times is None:
        times = events.grid(start, end, step)
    if sun is None:
        sun = ephemeris.body_positions(observer.lat_deg, observer.lon_deg, observer.height_m, times, "SUN")
    if earth is None:
        earth = ephemeris.body_positions(observer.lat_deg, observer.lon_deg, observer.height_m, times, "EARTH")

    geometry = _Geometry(observer)
    tolerance_s = events.BISECT_TOLERANCE_S
    margins = [_overlap_margin(s, e) for s, e in zip(sun, earth)]
    buffer_deg = DRIFT_DEG_PER_HOUR * step / 60.0
    last = len(times) - 1

    found: list[Eclipse] = []
    for i, value in enumerate(margins):
        if value >= buffer_deg:
            continue
        if (i > 0 and margins[i - 1] < value) or (i < last and margins[i + 1] < value):
            continue

        lo, hi = times[max(i - 1, 0)], times[min(i + 1, last)]
        moment = geometry.closest(lo, hi, tolerance_s) if hi > lo else times[i]
        sun_at, earth_at = geometry.pair(moment)
        if _overlap_margin(sun_at, earth_at) >= 0.0:
            continue
        if any(abs(moment - e.max_utc) <= MERGE_WINDOW for e in found):
            continue
        if events.margin_deg(sun_at, observer.profile, CRITERION) <= 0.0:
            continue

        before = [k for k in range(len(times)) if times[k] <= moment]
        k = before[-1] if before else 0
        while k >= 0 and margins[k] < 0.0:
            k -= 1
        start_utc = None if k < 0 else geometry.crossing(times[k], moment, tolerance_s)

        after = [k for k in range(len(times)) if times[k] >= moment]
        k = after[0] if after else last
        while k <= last and margins[k] < 0.0:
            k += 1
        end_utc = None if k > last else geometry.crossing(times[k], moment, tolerance_s)

        covered = obscured_fraction(
            angular_separation_deg(
                sun_at.azimuth_true_deg, sun_at.elevation_deg, earth_at.azimuth_true_deg, earth_at.elevation_deg
            ),
            sun_at.radius_deg,
            earth_at.radius_deg,
        )
        found.append(Eclipse(start_utc, end_utc, moment.replace(microsecond=0), covered))

    return sorted(found, key=lambda e: e.max_utc)


def eclipse_events(eclipses: list[Eclipse]) -> list[dict[str, Any]]:
    """``eclipse_start`` and ``eclipse_end`` events (``SkyEvent`` fields plus ``max_obscured_fraction``)."""

    result = []
    for item in eclipses:
        for kind, moment in (("eclipse_start", item.start_utc), ("eclipse_end", item.end_utc)):
            if moment is None:
                continue
            result.append({
                "type": kind,
                "utc": moment,
                "utc_earliest": None,
                "utc_latest": None,
                "criterion": CRITERION,
                "max_obscured_fraction": item.max_obscured_fraction,
            })
    return result
