"""Eclipse geometry and the T5 reference test (tutulmalar.md, dogrulama No 69 to 72)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np
import pytest

from app.core.eclipse import Eclipse, angular_separation_deg, eclipse_events, find_eclipses, obscured_fraction
from app.core.events import Observer
from app.terrain.horizon import get_horizon_profile

TWO_MINUTES = timedelta(minutes=2)
APOLLO_11 = (0.67416, 23.47314)
CHANGE_4 = (-45.4446, 177.5991)


def _utc(*args: int) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def _flat_observer(lat: float, lon: float) -> Observer:
    return Observer(lat, lon, 0.0, get_horizon_profile(lat, lon, 0.0))


def test_separated_disks_cover_nothing() -> None:
    assert obscured_fraction(2.0, 0.27, 0.95) == 0.0


def test_earth_inside_covers_the_whole_sun() -> None:
    assert obscured_fraction(0.5, 0.27, 0.95) == 1.0


def test_partial_cover_shrinks_with_separation() -> None:
    separations = np.linspace(0.70, 1.20, 11)
    covered = obscured_fraction(separations, 0.27, 0.95)
    assert isinstance(covered, np.ndarray)
    assert np.all((covered > 0.0) & (covered < 1.0))
    assert np.all(np.diff(covered) < 0.0)


def test_smaller_disk_inside_the_sun_covers_its_area_share() -> None:
    assert obscured_fraction(0.0, 0.27, 0.1) == pytest.approx((0.1 / 0.27) ** 2)


@pytest.mark.parametrize(
    "a, b, expected",
    [((0, 0), (0, 0), 0.0), ((0, 0), (90, 0), 90.0), ((0, 0), (0, 90), 90.0), ((10, 5), (12, 5), 1.992)],
)
def test_angular_separation(a: tuple, b: tuple, expected: float) -> None:
    assert angular_separation_deg(*a, *b) == pytest.approx(expected, abs=0.001)


@pytest.mark.parametrize("step_minutes", [30, 360])
def test_t5_apollo_11_february_2027(step_minutes: int) -> None:
    found = find_eclipses(
        _flat_observer(*APOLLO_11), _utc(2027, 2, 20), _utc(2027, 2, 22), step_minutes=step_minutes
    )
    assert len(found) == 1
    eclipse = found[0]
    assert abs(eclipse.start_utc - _utc(2027, 2, 20, 22, 9)) <= TWO_MINUTES
    assert abs(eclipse.end_utc - _utc(2027, 2, 21, 0, 36)) <= TWO_MINUTES
    assert eclipse.max_obscured_fraction == pytest.approx(0.343, abs=0.005)
    assert eclipse.start_utc < eclipse.max_utc < eclipse.end_utc


def test_no_eclipse_when_disks_stay_1_4_degrees_apart() -> None:
    assert find_eclipses(_flat_observer(*APOLLO_11), _utc(2027, 7, 17), _utc(2027, 7, 19)) == []


def test_no_eclipse_when_disks_miss_by_five_thousandths_of_a_degree() -> None:
    assert find_eclipses(_flat_observer(*APOLLO_11), _utc(2027, 8, 16), _utc(2027, 8, 18)) == []


def test_far_side_site_with_the_sun_down_gets_no_eclipse() -> None:
    assert find_eclipses(_flat_observer(*CHANGE_4), _utc(2019, 1, 20), _utc(2019, 1, 23)) == []


def test_eclipse_running_at_the_range_start_has_no_start_event() -> None:
    found = find_eclipses(_flat_observer(*APOLLO_11), _utc(2027, 2, 20, 23), _utc(2027, 2, 21, 2))
    assert len(found) == 1
    assert found[0].start_utc is None
    assert abs(found[0].end_utc - _utc(2027, 2, 21, 0, 36)) <= TWO_MINUTES


def test_eclipse_events_fields_and_order() -> None:
    full = Eclipse(_utc(2027, 2, 20, 22, 9), _utc(2027, 2, 21, 0, 36), _utc(2027, 2, 20, 23, 22), 0.343)
    cut = Eclipse(_utc(2027, 3, 1), None, _utc(2027, 3, 1, 1), 0.1)
    result = eclipse_events([full, cut])
    assert [e["type"] for e in result] == ["eclipse_start", "eclipse_end", "eclipse_start"]
    for event in result:
        assert event["criterion"] == "first_limb"
        assert event["utc_earliest"] is None and event["utc_latest"] is None
    assert result[0]["max_obscured_fraction"] == 0.343
    assert result[0]["utc"] == full.start_utc
