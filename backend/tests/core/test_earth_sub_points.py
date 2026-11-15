"""Earth-fixed sub-lunar and sub-solar points (``ephemeris.sub_points``, #122).

Expected values come from a JPL Horizons observer table, queried on
15 November 2026 (07:33 UTC) through https://ssd.jpl.nasa.gov/api/horizons.api
with ``COMMAND='399'`` (Earth), ``CENTER='500@301'`` (Moon centre),
``EPHEM_TYPE='OBSERVER'``, ``QUANTITIES='14,15'`` (``ObsSub-LON``,
``ObsSub-LAT``, ``SunSub-LON``, ``SunSub-LAT``), ``ANG_FORMAT='DEG'``,
``EXTRA_PREC='YES'``, ``TIME_TYPE='UT'`` and ``TLIST`` with the instants below.
Horizons header: target radii 6378.137 x 6356.752 km, Earth orientation
ITRF93 (high precision), east longitude positive, source DE441.

Horizons gives planetodetic latitudes of the point where the line to the
Earth's centre meets the ellipsoid; we serve planetocentric latitudes (the
direction from the centre), so the expected latitude is converted with
``atan((c/a)^2 tan(lat))``. After that conversion latitudes agree within
0.003 degrees.

Tolerance, 0.1 degrees, the same reason as the station elevations of #99
(``test_stations.py``): ``IAU_EARTH`` turns the Earth with a linear rotation
model (no nutation, no UT1 correction) while Horizons uses ITRF93 with Earth
orientation parameters. Over the four instants the longitudes differ by
+0.081 to +0.091 degrees, a nearly constant offset of the rotation angle; the
latitudes do not depend on it.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
import spiceypy

from app.core import ephemeris

TOL_DEG = 0.1
LAT_TOL_DEG = 0.01
WGS84_A_KM, WGS84_C_KM = 6378.137, 6356.752

# (utc, ObsSub-LON, ObsSub-LAT, SunSub-LON, SunSub-LAT), Horizons, planetodetic.
HORIZONS_CASES = [
    ("2025-03-06T17:30:00Z", 8.012734, 28.122745, 280.283558, -5.405484),
    ("2026-12-05T00:00:00Z", 130.147432, -14.936343, 177.601493, -22.473236),
    ("2026-12-15T12:00:00Z", 71.111668, -9.243639, 358.786528, -23.418996),
    ("2027-02-20T22:00:00Z", 32.315611, 10.180751, 213.422408, -10.820634),
]


def _utc(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def _lon_diff(actual: float, expected: float) -> float:
    return (actual - expected + 180.0) % 360.0 - 180.0


def planetocentric(lat_deg: float) -> float:
    """Planetocentric latitude of a surface point given its planetodetic latitude."""

    return math.degrees(math.atan((WGS84_C_KM / WGS84_A_KM) ** 2 * math.tan(math.radians(lat_deg))))


@pytest.mark.parametrize(
    ("utc", "moon_lon", "moon_lat", "sun_lon", "sun_lat"),
    HORIZONS_CASES,
    ids=[case[0] for case in HORIZONS_CASES],
)
def test_earth_sub_points_match_horizons(utc, moon_lon, moon_lat, sun_lon, sun_lat):
    (p,) = ephemeris.sub_points([_utc(utc)])
    assert abs(_lon_diff(p.earth_sub_lunar_lon_deg, moon_lon)) <= TOL_DEG
    assert abs(_lon_diff(p.earth_sub_solar_lon_deg, sun_lon)) <= TOL_DEG
    assert p.earth_sub_lunar_lat_deg == pytest.approx(planetocentric(moon_lat), abs=LAT_TOL_DEG)
    assert p.earth_sub_solar_lat_deg == pytest.approx(planetocentric(sun_lat), abs=LAT_TOL_DEG)
    for lon in (p.earth_sub_lunar_lon_deg, p.earth_sub_solar_lon_deg):
        assert -180.0 <= lon < 180.0


def _unwrapped(values: list[float]) -> list[float]:
    out = [values[0]]
    for v in values[1:]:
        out.append(out[-1] + _lon_diff(v, out[-1]))
    return out


def _turn_hours(attr: str, start: datetime, hours: int = 72) -> float:
    """Hours for one westward turn of an Earth-fixed longitude, from hourly samples."""

    times = [start + timedelta(hours=h) for h in range(hours + 1)]
    lons = _unwrapped([getattr(p, attr) for p in ephemeris.sub_points(times)])
    rate = (lons[-1] - lons[0]) / hours  # degrees per hour, negative: the Earth turns east
    return 360.0 / -rate


def test_sub_solar_longitude_turns_once_a_day():
    assert _turn_hours("earth_sub_solar_lon_deg", _utc("2026-12-01T00:00:00Z")) == pytest.approx(24.0, abs=0.05)


def test_sub_lunar_longitude_turns_in_about_24_8_hours():
    # Mean lunar day 24 h 50 min; over three days the Moon's speed varies, so 0.3 h.
    assert _turn_hours("earth_sub_lunar_lon_deg", _utc("2026-12-01T00:00:00Z")) == pytest.approx(24.84, abs=0.3)


def _station_dir(lat_deg: float, lon_deg: float, height_m: float) -> list[float]:
    f = 1.0 - WGS84_C_KM / WGS84_A_KM
    return list(spiceypy.georec(math.radians(lon_deg), math.radians(lat_deg), height_m / 1000.0,
                                WGS84_A_KM, f))


def _angle_deg(a, b) -> float:
    return math.degrees(spiceypy.vsep(a, b))


def test_moon_in_view_means_sub_lunar_point_is_near(monkeypatch):
    """Inside a #99 station window the station is within 90 deg minus the limit of the sub-lunar point."""

    from app.core import stations

    monkeypatch.setenv("FEZA_DATA_DIR", str(Path(__file__).resolve().parents[3] / "data"))
    start, end = _utc("2026-12-01T00:00:00Z"), _utc("2026-12-03T00:00:00Z")
    limit = stations.DEFAULT_MIN_ELEVATION_DEG
    checked = 0
    for station in stations.load_stations():
        site = _station_dir(station.lat_deg, station.lon_deg, station.elevation_m)
        for window in stations.station_windows(station, start, end, limit):
            a, b = window
            moments = [a + (b - a) * k / 4 for k in range(5)]
            for moment, p in zip(moments, ephemeris.sub_points(moments)):
                below = spiceypy.latrec(1.0, math.radians(p.earth_sub_lunar_lon_deg),
                                        math.radians(p.earth_sub_lunar_lat_deg))
                assert _angle_deg(site, below) < 90.0 - limit, (station.id, moment)
                checked += 1
    assert checked >= 15  # three stations, at least one pass each over two days
