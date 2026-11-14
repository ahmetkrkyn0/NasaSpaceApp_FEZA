"""Direct-to-Earth communication window at an instant (``CommWindow``, iletisim-penceresi.md)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.core.events import Observer
from app.core.now import forward_track, next_crossing
from app.terrain.horizon import horizon_at


def comm_window(observer: Observer, utc: datetime, earth_criterion: str) -> dict[str, Any]:
    """Whether Earth is visible at ``utc`` and minutes until that changes.

    The search runs ``now.SEARCH_HOURS`` ahead (less near the end of the
    ephemeris range); ``searched_hours`` reports what was actually searched.
    """

    track = forward_track(observer, "EARTH", earth_criterion, utc)
    position = track.positions[0]
    visible = track.visible_at(0)
    change = next_crossing(track.crossings(), utc)
    searched_hours = (track.times[-1] - utc).total_seconds() / 3600.0

    minutes = None if change is None else (change.utc - utc).total_seconds() / 60.0
    return {
        "utc": utc,
        "visible_now": visible,
        "minutes_remaining": minutes if visible else None,
        "minutes_until_visible": None if visible else minutes,
        "next_change_utc": None if change is None else change.utc,
        "search_limited": change is None,
        "searched_hours": searched_hours,
        "earth_elevation_deg": position.elevation_deg,
        "earth_azimuth_true_deg": position.azimuth_true_deg,
        "horizon_deg": horizon_at(observer.profile, position.azimuth_true_deg),
        "criterion": earth_criterion,
        "validity": observer.validity,
    }
