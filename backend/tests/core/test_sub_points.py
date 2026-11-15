"""Reference tests for the sub-solar and sub-Earth points (``ephemeris.sub_points``).

Expected values come from JPL Horizons observer tables, queried on
15 November 2026 (06:24 UTC) through https://ssd.jpl.nasa.gov/api/horizons.api
with these parameters:

* Sub-points: ``COMMAND='301'`` (Moon), ``CENTER='500@399'`` (Earth geocentre),
  ``EPHEM_TYPE='OBSERVER'``, ``QUANTITIES='14,15'`` (``ObsSub-LON``,
  ``ObsSub-LAT``, ``SunSub-LON``, ``SunSub-LAT``), ``ANG_FORMAT='DEG'``,
  ``EXTRA_PREC='YES'``, ``TIME_TYPE='UT'``, ``TLIST`` with the instants below.
  Horizons header: target radii 1737.4 km sphere, source DE441, positive
  longitude to the east.
* Earth distance: ``COMMAND='399'`` (Earth), ``CENTER='500@301'`` (Moon
  centre), ``QUANTITIES='20'`` (``delta``, light-time aberrated range, AU),
  same instants.

Tolerance, 0.01 degrees for every angle (0.30 km on the 1737.4 km sphere):

* The sub-solar point matches Horizons to about 0.0002 degrees. The residual
  is the 1.3 s light time between the Earth-based Horizons table and our
  Moon-centred observer.
* The sub-Earth point differs by up to 0.006 degrees. Horizons computes
  ``ObsSub`` with the down-leg light time only, without stellar aberration,
  while we apply ``LT+S`` (ADR-0002, rule 11). The aberration angle is v/c for
  the Moon's ~30 km/s barycentric speed, 1.0e-4 rad = 0.0057 degrees, which is
  the size of the difference. ``test_frame_matches_horizons`` reproduces both
  Horizons quantities with SPICE to 0.0001 degrees, so the frame (``MOON_ME``)
  and the kernels agree; the remaining difference is only the aberration term.

Distance tolerance, 1 km: the measured difference is a few metres (DE440
against Horizons' DE441). The range does not depend on the aberration term.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta

import pytest
import spiceypy

from app.core import ephemeris
from app.errors import DateOutOfRange

ANGLE_TOL_DEG = 0.01
FRAME_TOL_DEG = 0.0001
DISTANCE_TOL_KM = 1.0

# (utc, ObsSub-LON, ObsSub-LAT, SunSub-LON, SunSub-LAT, delta Moon->Earth in AU)
HORIZONS_CASES = [
    ("2025-03-06T17:30:00Z", 5.380904, -6.693034, 94.751136, -0.313909, 0.00250763470569),
    ("2026-12-05T00:00:00Z", 5.966154, 5.929357, 231.377145, -1.455001, 0.00263691477836),
    ("2026-12-15T12:00:00Z", 353.756549, -1.263385, 103.428549, -1.364209, 0.00266272441317),
    ("2027-02-20T22:00:00Z", 2.913908, 1.292023, 3.739641, 0.333923, 0.00242750518119),
]


def _utc(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def _lon_diff(actual: float, expected: float) -> float:
    """Signed longitude difference in (-180, 180] so 359 and -1 compare equal."""
    return (actual - expected + 180.0) % 360.0 - 180.0


@pytest.mark.parametrize(
    ("utc", "earth_lon", "earth_lat", "sun_lon", "sun_lat", "distance_au"),
    HORIZONS_CASES,
    ids=[case[0] for case in HORIZONS_CASES],
)
def test_sub_points_match_horizons(
    utc: str,
    earth_lon: float,
    earth_lat: float,
    sun_lon: float,
    sun_lat: float,
    distance_au: float,
) -> None:
    (point,) = ephemeris.sub_points([_utc(utc)])

    assert _lon_diff(point.sub_solar_lon_deg, sun_lon) == pytest.approx(0.0, abs=ANGLE_TOL_DEG)
    assert point.sub_solar_lat_deg == pytest.approx(sun_lat, abs=ANGLE_TOL_DEG)
    assert _lon_diff(point.sub_earth_lon_deg, earth_lon) == pytest.approx(0.0, abs=ANGLE_TOL_DEG)
    assert point.sub_earth_lat_deg == pytest.approx(earth_lat, abs=ANGLE_TOL_DEG)
    assert point.earth_distance_km == pytest.approx(
        distance_au * ephemeris.AU_KM, abs=DISTANCE_TOL_KM
    )


@pytest.mark.parametrize(
    ("utc", "earth_lon", "earth_lat", "sun_lon", "sun_lat"),
    [case[:5] for case in HORIZONS_CASES],
    ids=[case[0] for case in HORIZONS_CASES],
)
def test_frame_matches_horizons(
    utc: str, earth_lon: float, earth_lat: float, sun_lon: float, sun_lat: float
) -> None:
    """With Horizons' own settings SPICE gives the same numbers: the frame is right."""
    ephemeris.ensure_loaded()
    et = spiceypy.str2et(ephemeris.to_spice_utc(_utc(utc)))

    obs_sub, _, _ = spiceypy.subpnt(
        "INTERCEPT/ELLIPSOID", "MOON", et, "MOON_ME", "LT", "EARTH"
    )
    sun_sub, _, _ = spiceypy.subslr(
        "INTERCEPT/ELLIPSOID", "MOON", et, "MOON_ME", "LT+S", "EARTH"
    )
    _, obs_lon, obs_lat = spiceypy.reclat(obs_sub)
    _, slr_lon, slr_lat = spiceypy.reclat(sun_sub)

    assert _lon_diff(math.degrees(obs_lon), earth_lon) == pytest.approx(0.0, abs=FRAME_TOL_DEG)
    assert math.degrees(obs_lat) == pytest.approx(earth_lat, abs=FRAME_TOL_DEG)
    assert _lon_diff(math.degrees(slr_lon), sun_lon) == pytest.approx(0.0, abs=FRAME_TOL_DEG)
    assert math.degrees(slr_lat) == pytest.approx(sun_lat, abs=FRAME_TOL_DEG)


def test_sub_solar_longitude_turns_once_in_a_synodic_month() -> None:
    """The Sun goes once round the Moon in ~29.5 days, westward (longitude falls)."""
    start = _utc("2026-12-01T00:00:00Z")
    times = [start + timedelta(hours=6 * i) for i in range(4 * 30 + 1)]
    points = ephemeris.sub_points(times)

    total = 0.0
    for before, after in zip(points, points[1:]):
        total += _lon_diff(after.sub_solar_lon_deg, before.sub_solar_lon_deg)

    # 30 days of a 29.53-day synodic month is 365.7 degrees.
    assert -385.0 < total < -345.0


def test_sub_points_stay_in_physical_bounds() -> None:
    start = _utc("2026-12-01T00:00:00Z")
    times = [start + timedelta(hours=12 * i) for i in range(2 * 60 + 1)]

    for point in ephemeris.sub_points(times):
        assert -180.0 <= point.sub_solar_lon_deg < 180.0
        assert -180.0 <= point.sub_earth_lon_deg < 180.0
        # Lunar pole tilt to the ecliptic is 1.54 degrees.
        assert abs(point.sub_solar_lat_deg) < 1.7
        # Optical libration: about 7.9 degrees in longitude, 6.9 in latitude.
        assert abs(point.sub_earth_lon_deg) < 8.5
        assert abs(point.sub_earth_lat_deg) < 7.5
        assert 356_000.0 < point.earth_distance_km < 407_000.0


def test_sub_points_rejects_dates_outside_the_kernels() -> None:
    with pytest.raises(DateOutOfRange):
        ephemeris.sub_points([_utc("1500-01-01T00:00:00Z")])
