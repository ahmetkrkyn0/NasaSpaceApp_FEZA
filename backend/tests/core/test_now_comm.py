"""State at an instant (``now_status``) and the communication window (``comm_window``)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.core.comm import comm_window
from app.core.events import Observer, compute_events
from app.core.now import SEARCH_HOURS, now_status
from app.terrain.horizon import get_horizon_profile

TWO_MINUTES_H = 2.0 / 60.0
MONS_MOUTON = (-84.78, 29.13)
CHANGE_4 = (-45.4446, 177.5991)


def _utc(*args: int) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def _flat(lat: float, lon: float) -> Observer:
    return Observer(lat, lon, 0.0, get_horizon_profile(lat, lon, 0.0))


def test_earth_below_horizon_on_6_december() -> None:
    status = now_status(_flat(*MONS_MOUTON), _utc(2026, 12, 6), "center")

    assert status["earth_up"] is False
    assert status["hours_to_earthset"] is None
    # 6 Dec 00:00 to the T2b earthrise, 11 Dec 04:41.
    assert status["hours_to_earthrise"] == pytest.approx(124.68, abs=TWO_MINUTES_H + 0.01)
    assert status["criterion"] == "center"
    assert status["search_limited"] is False
    assert status["validity"] == "SYNTHETIC"


def test_night_hours_match_the_dark_window() -> None:
    observer = _flat(*MONS_MOUTON)
    status = now_status(observer, _utc(2026, 12, 5), "center")
    result = compute_events(observer, _utc(2026, 11, 25), _utc(2026, 12, 25))
    dark = [w for w in result["windows"] if w["kind"] == "dark" and w["start_utc"] < _utc(2026, 12, 5) < w["end_utc"]]

    assert status["sun_up"] is False
    assert len(dark) == 1
    assert status["night_hours"] == pytest.approx(dark[0]["duration_hours"], abs=1 / 60)
    sunrise = dark[0]["end_utc"]
    assert status["hours_to_sunrise"] == pytest.approx((sunrise - _utc(2026, 12, 5)).total_seconds() / 3600, abs=1 / 60)


def test_night_hours_when_sun_is_up_is_the_next_night() -> None:
    observer = _flat(*MONS_MOUTON)
    status = now_status(observer, _utc(2026, 12, 20), "center")

    assert status["sun_up"] is True
    assert status["hours_to_sunset"] is not None
    assert status["night_hours"] is not None and status["night_hours"] > 0


def test_earth_never_rises_at_change_4_marks_search_limited() -> None:
    status = now_status(_flat(*CHANGE_4), _utc(2019, 1, 3, 2, 26), "center")

    assert status["earth_up"] is False
    assert status["hours_to_earthrise"] is None
    assert status["search_limited"] is True


def test_comm_window_on_5_december() -> None:
    window = comm_window(_flat(*MONS_MOUTON), _utc(2026, 12, 5), "center")

    assert window["visible_now"] is False
    assert window["minutes_remaining"] is None
    assert abs(window["next_change_utc"] - _utc(2026, 12, 11, 4, 41)) <= timedelta(minutes=2)
    assert window["minutes_until_visible"] == pytest.approx(
        (window["next_change_utc"] - _utc(2026, 12, 5)).total_seconds() / 60
    )
    assert window["searched_hours"] == pytest.approx(SEARCH_HOURS)
    assert window["search_limited"] is False
    assert window["earth_elevation_deg"] < 0.0
    assert window["horizon_deg"] == 0.0


def test_comm_window_criteria_order_on_earthrise() -> None:
    """The first limb clears the horizon before the centre, the full disk after it."""

    observer = _flat(*MONS_MOUTON)
    changes = {
        criterion: comm_window(observer, _utc(2026, 12, 5), criterion)["next_change_utc"]
        for criterion in ("first_limb", "center", "full_disk")
    }
    assert changes["first_limb"] < changes["center"] < changes["full_disk"]


def test_comm_window_without_earthrise_is_search_limited() -> None:
    window = comm_window(_flat(*CHANGE_4), _utc(2019, 1, 3, 2, 26), "center")

    assert window["visible_now"] is False
    assert window["next_change_utc"] is None
    assert window["minutes_until_visible"] is None
    assert window["search_limited"] is True
    assert window["earth_elevation_deg"] == pytest.approx(-39.20, abs=0.01)
