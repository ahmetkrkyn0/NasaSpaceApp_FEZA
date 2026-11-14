"""Reference tests for event search (T2b, T7) and window bookkeeping."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.core.events import Observer, compute_events
from app.terrain.horizon import HorizonProfile, get_horizon_profile

TWO_MINUTES = timedelta(minutes=2)
MONS_MOUTON = (-84.78, 29.13)
APOLLO_11 = (0.67416, 23.47314)
CHANGE_4 = (-45.4446, 177.5991)


def _utc(*args: int) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def _flat_observer(lat: float, lon: float) -> Observer:
    """Height zero on the sphere: horizon at zero degrees in every direction."""

    return Observer(lat, lon, 0.0, get_horizon_profile(lat, lon, 0.0))


@pytest.fixture(scope="module")
def mons_mouton_december() -> dict:
    return compute_events(_flat_observer(*MONS_MOUTON), _utc(2026, 12, 1), _utc(2026, 12, 31), "center")


def test_t2b_earth_set_rise_set(mons_mouton_december: dict) -> None:
    earth = [e for e in mons_mouton_december["events"] if e["type"].startswith("earth")]
    expected = [
        ("earthset", _utc(2026, 12, 3, 10, 3)),
        ("earthrise", _utc(2026, 12, 11, 4, 41)),
        ("earthset", _utc(2026, 12, 30, 11, 2)),
    ]
    assert [e["type"] for e in earth] == [kind for kind, _ in expected]
    for event, (_, moment) in zip(earth, expected):
        assert abs(event["utc"] - moment) <= TWO_MINUTES, (event, moment)
        assert event["criterion"] == "center"


def test_t2b_earth_visible_fraction(mons_mouton_december: dict) -> None:
    assert mons_mouton_december["metrics"]["earth_visible_fraction"] == pytest.approx(0.723, abs=0.005)


def test_t2a_max_sun_elevation_in_metrics(mons_mouton_december: dict) -> None:
    assert mons_mouton_december["metrics"]["max_sun_elevation_deg"] == pytest.approx(6.47, abs=0.01)


def test_flat_horizon_result_is_synthetic(mons_mouton_december: dict) -> None:
    assert mons_mouton_december["validity"] == "SYNTHETIC"


def test_sun_events_use_first_limb(mons_mouton_december: dict) -> None:
    sun = [e for e in mons_mouton_december["events"] if e["type"] in ("sunrise", "sunset")]
    assert sun
    assert all(e["criterion"] == "first_limb" for e in sun)


def test_events_are_refined_off_the_grid(mons_mouton_december: dict) -> None:
    """Bisection places events between 30-minute grid points, to the second."""

    off_grid = [e for e in mons_mouton_december["events"] if e["utc"].minute % 30 or e["utc"].second]
    assert off_grid


def test_windows_cover_the_range_per_body(mons_mouton_december: dict) -> None:
    windows = mons_mouton_december["windows"]
    for kinds in (("sunlit", "dark"), ("earth_visible", "earth_hidden")):
        body = [w for w in windows if w["kind"] in kinds]
        assert body[0]["start_utc"] == _utc(2026, 12, 1)
        assert body[-1]["end_utc"] == _utc(2026, 12, 31)
        assert sum(w["duration_hours"] for w in body) == pytest.approx(720.0)
        for earlier, later in zip(body, body[1:]):
            assert earlier["end_utc"] == later["start_utc"]
            assert earlier["kind"] != later["kind"]


def test_longest_earth_hidden_matches_window(mons_mouton_december: dict) -> None:
    # 3 Dec 10:03 to 11 Dec 04:41 is 186.63 h (T2b instants).
    assert mons_mouton_december["metrics"]["longest_earth_hidden_hours"] == pytest.approx(186.63, abs=2 * 2 / 60)


def _sunrise_shift_minutes(result: dict) -> float:
    sunrise = next(e for e in result["events"] if e["type"] == "sunrise" and e["utc_earliest"] is not None)
    assert sunrise["utc_earliest"] <= sunrise["utc"] <= sunrise["utc_latest"]
    return (sunrise["utc_latest"] - sunrise["utc_earliest"]).total_seconds() / 60.0 / 2.0


def test_t7_sensitivity_near_equator() -> None:
    result = compute_events(_flat_observer(*APOLLO_11), _utc(2026, 12, 1), _utc(2026, 12, 31))
    assert 1.5 <= _sunrise_shift_minutes(result) <= 3.0


def test_t7_sensitivity_at_mons_mouton(mons_mouton_december: dict) -> None:
    assert _sunrise_shift_minutes(mons_mouton_december) >= 21.0


def test_earth_never_visible_at_change_4_in_2019() -> None:
    result = compute_events(
        _flat_observer(*CHANGE_4), _utc(2019, 1, 1), _utc(2020, 1, 1), "first_limb", step_minutes=360
    )
    assert result["metrics"]["earth_visible_fraction"] == 0.0
    assert not [e for e in result["events"] if e["type"].startswith("earth")]
    assert result["metrics"]["longest_earth_hidden_hours"] == pytest.approx(365 * 24)
    assert result["relay_status"] == "required"
    assert result["relay_required"] is True


def test_raised_horizon_hides_earth_longer() -> None:
    lat, lon = MONS_MOUTON
    raised = Observer(lat, lon, 0.0, HorizonProfile(lat, lon, None, 0.0, [1.0] * 720, "sphere"))
    flat = compute_events(_flat_observer(lat, lon), _utc(2026, 12, 1), _utc(2026, 12, 31))
    high = compute_events(raised, _utc(2026, 12, 1), _utc(2026, 12, 31))
    assert high["metrics"]["earth_visible_fraction"] < flat["metrics"]["earth_visible_fraction"]


def test_relay_is_intermittent_at_mons_mouton_in_december(mons_mouton_december: dict) -> None:
    assert mons_mouton_december["relay_status"] == "intermittent"
    assert mons_mouton_december["relay_required"] is False


def test_relay_is_unknown_for_a_short_range_without_earth() -> None:
    result = compute_events(_flat_observer(*MONS_MOUTON), _utc(2026, 12, 5), _utc(2026, 12, 9))
    assert result["metrics"]["earth_visible_fraction"] == 0.0
    assert result["relay_status"] == "unknown"
    assert result["relay_required"] is False


def test_t5_eclipse_events_at_apollo_11() -> None:
    result = compute_events(_flat_observer(*APOLLO_11), _utc(2027, 2, 20), _utc(2027, 2, 22))
    eclipse = [e for e in result["events"] if e["type"].startswith("eclipse")]

    assert [e["type"] for e in eclipse] == ["eclipse_start", "eclipse_end"]
    assert abs(eclipse[0]["utc"] - _utc(2027, 2, 20, 22, 9)) <= TWO_MINUTES
    assert abs(eclipse[1]["utc"] - _utc(2027, 2, 21, 0, 36)) <= TWO_MINUTES
    for event in eclipse:
        assert event["criterion"] == "first_limb"
        assert event["utc_earliest"] is None and event["utc_latest"] is None
        assert event["max_obscured_fraction"] == pytest.approx(0.343, abs=0.005)
    times = [e["utc"] for e in result["events"]]
    assert times == sorted(times)


def test_rise_and_set_events_carry_no_obscured_fraction(mons_mouton_december: dict) -> None:
    assert all("max_obscured_fraction" not in e for e in mons_mouton_december["events"])
