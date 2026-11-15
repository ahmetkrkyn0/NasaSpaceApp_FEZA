"""Ground stations and link windows (``app.core.stations``, ``ephemeris.moon_elevations_from_earth``).

Expected Moon elevations come from JPL Horizons observer tables, queried on
15 November 2026 (07:08 UTC) through https://ssd.jpl.nasa.gov/api/horizons.api
with these parameters, one query per station:

``COMMAND='301'`` (Moon), ``CENTER='coord@399'``, ``COORD_TYPE='GEODETIC'``,
``SITE_COORD`` = the station's east longitude, latitude and height in km
(below), ``EPHEM_TYPE='OBSERVER'``, ``QUANTITIES='4'`` (airless apparent
azimuth and elevation of the target centre), ``APPARENT='AIRLESS'``,
``ANG_FORMAT='DEG'``, ``EXTRA_PREC='YES'``, ``TIME_TYPE='UT'``, ``TLIST`` with
the instants below. Horizons header: centre radii 6378.137 x 6356.752 km
(WGS 84), pole ITRF93, EOP file eop.261113.p270209, source DE441.

Station coordinates are DSN 810-005, module 301, Rev. P, Table 5 (WGS 84):
DSS 14 (Goldstone), DSS 63 (Madrid), DSS 43 (Canberra).

Tolerance, 0.1 degrees. Over all 36 queried instants (12 per station, Moon up
and down) the largest difference is 0.071 degrees. It comes from the Earth
orientation model: the kernel set only has ``IAU_EARTH`` (no nutation, no UT1
correction), while Horizons uses ITRF93 with Earth orientation parameters.
With NAIF's ``earth_latest_high_prec.bpc`` loaded and the frame switched to
``ITRF93``, the same SPICE call matched the 30 instants before 2027 to
0.0001 degrees in elevation (checked once by hand; that kernel is not part of
the set and does not cover 2027). A 0.07 degree rotation error is about 17 seconds of
Earth rotation, so station window edges move by well under a minute.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.core import ephemeris, stations
from app.core.events import Crossing
from app.errors import DataUnavailable
from app.models.earth_link import GroundStation, StationSource

ELEVATION_TOL_DEG = 0.1

# Horizons SITE_COORD: east longitude (deg), latitude (deg), height (km).
SITE_COORD = {
    "dsn-goldstone": (243.110462, 35.425901, 1.001390),
    "dsn-madrid": (355.751991, 40.431210, 0.864816),
    "dsn-canberra": (148.981267, -35.402424, 0.688867),
}

# (station, utc, Horizons elevation in degrees); the instants with the Moon up.
HORIZONS_CASES = [
    ("dsn-goldstone", "2025-06-01T21:00:00Z", 31.050092207),
    ("dsn-goldstone", "2026-12-05T12:00:00Z", 2.627520007),
    ("dsn-goldstone", "2026-12-05T18:00:00Z", 33.645805881),
    ("dsn-goldstone", "2026-12-15T00:00:00Z", 42.001785389),
    ("dsn-goldstone", "2027-03-01T15:00:00Z", 26.088301475),
    ("dsn-madrid", "2025-06-01T21:00:00Z", 37.820654739),
    ("dsn-madrid", "2026-12-05T06:00:00Z", 17.673393878),
    ("dsn-madrid", "2026-12-05T12:00:00Z", 20.451884126),
    ("dsn-madrid", "2026-12-15T12:00:00Z", 4.047413679),
    ("dsn-madrid", "2026-12-15T18:00:00Z", 39.762555190),
    ("dsn-madrid", "2027-03-01T03:00:00Z", 1.405982470),
    ("dsn-canberra", "2025-06-01T09:00:00Z", 29.083552632),
    ("dsn-canberra", "2026-12-05T00:00:00Z", 62.975923188),
    ("dsn-canberra", "2026-12-05T18:00:00Z", 18.072514175),
    ("dsn-canberra", "2026-12-15T00:00:00Z", 0.269157601),
    ("dsn-canberra", "2026-12-15T06:00:00Z", 63.216116791),
    ("dsn-canberra", "2026-12-15T12:00:00Z", 14.269855229),
    ("dsn-canberra", "2027-03-01T03:00:00Z", 12.001203066),
    ("dsn-canberra", "2027-03-01T15:00:00Z", 12.780693190),
]


def _utc(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def _station(station_id: str) -> GroundStation:
    lon_east, lat, height_km = SITE_COORD[station_id]
    return GroundStation(
        id=station_id,
        name=station_id,
        lat_deg=lat,
        lon_deg=ephemeris.wrap_lon_deg(lon_east),
        elevation_m=height_km * 1000.0,
        source=StationSource(label="test", url="https://example.invalid"),
        validity="MEASURED",
    )


@pytest.mark.parametrize(
    ("station_id", "utc", "expected"),
    HORIZONS_CASES,
    ids=[f"{case[0]}-{case[1]}" for case in HORIZONS_CASES],
)
def test_moon_elevation_matches_horizons(station_id: str, utc: str, expected: float) -> None:
    station = _station(station_id)
    (elevation,) = ephemeris.moon_elevations_from_earth(
        station.lat_deg, station.lon_deg, station.elevation_m, [_utc(utc)]
    )
    assert elevation == pytest.approx(expected, abs=ELEVATION_TOL_DEG)


def test_every_station_has_two_reference_instants_with_the_moon_up() -> None:
    for station_id in SITE_COORD:
        assert sum(1 for case in HORIZONS_CASES if case[0] == station_id and case[2] > 0) >= 2


def test_data_file_matches_the_queried_coordinates() -> None:
    by_id = {station.id: station for station in stations.load_stations()}
    assert set(by_id) == set(SITE_COORD)
    for station_id in SITE_COORD:
        expected = _station(station_id)
        assert by_id[station_id].lat_deg == pytest.approx(expected.lat_deg, abs=1e-9)
        assert by_id[station_id].lon_deg == pytest.approx(expected.lon_deg, abs=1e-9)
        assert by_id[station_id].elevation_m == pytest.approx(expected.elevation_m, abs=1e-6)


def test_station_window_edges_sit_on_the_threshold() -> None:
    station = _station("dsn-madrid")
    start, end = _utc("2026-12-01T00:00:00Z"), _utc("2026-12-04T00:00:00Z")
    windows = stations.station_windows(station, start, end, 10.0)

    assert len(windows) == 3
    edges = [moment for window in windows for moment in window if start < moment < end]
    elevations = ephemeris.moon_elevations_from_earth(
        station.lat_deg, station.lon_deg, station.elevation_m, edges
    )
    # One second of the Moon's diurnal motion is at most 0.0042 degrees.
    for elevation in elevations:
        assert elevation == pytest.approx(10.0, abs=0.005)
    for lo, hi in windows:
        assert timedelta(hours=8) < hi - lo < timedelta(hours=14)


def test_true_intervals_are_cut_at_the_query_ends() -> None:
    start, end = _utc("2026-12-01T00:00:00Z"), _utc("2026-12-02T00:00:00Z")
    crossings = [
        Crossing(utc=_utc("2026-12-01T03:00:00Z"), rising=False),
        Crossing(utc=_utc("2026-12-01T10:00:00Z"), rising=True),
    ]

    assert stations._true_intervals(True, crossings, start, end) == [
        (start, _utc("2026-12-01T03:00:00Z")),
        (_utc("2026-12-01T10:00:00Z"), end),
    ]
    assert stations._true_intervals(False, [], start, end) == []
    assert stations._true_intervals(True, [], start, end) == [(start, end)]


def _h(hour: float) -> datetime:
    return datetime(2026, 12, 1, tzinfo=timezone.utc) + timedelta(hours=hour)


def _assert_covers(windows: list[dict], start: datetime, end: datetime) -> None:
    assert windows[0]["start_utc"] == start
    assert windows[-1]["end_utc"] == end
    for before, after in zip(windows, windows[1:]):
        assert before["end_utc"] == after["start_utc"]
        assert before["mode"] != after["mode"]
    for window in windows:
        assert window["start_utc"] < window["end_utc"]


def test_link_windows_combine_site_and_stations() -> None:
    earth_visible = [(_h(0), _h(10)), (_h(14), _h(24))]
    station_view = {
        "dsn-goldstone": [(_h(5), _h(8))],
        "dsn-madrid": [(_h(1), _h(6)), (_h(11), _h(16))],
        "dsn-canberra": [(_h(20), _h(24))],
    }

    windows = stations.link_windows(_h(0), _h(24), earth_visible, station_view)

    assert [(w["start_utc"], w["end_utc"], w["mode"], w["station_ids"]) for w in windows] == [
        (_h(0), _h(1), "no_station", []),
        (_h(1), _h(8), "direct", ["dsn-madrid", "dsn-goldstone"]),
        (_h(8), _h(10), "no_station", []),
        (_h(10), _h(14), "relay_needed", []),
        (_h(14), _h(16), "direct", ["dsn-madrid"]),
        (_h(16), _h(20), "no_station", []),
        (_h(20), _h(24), "direct", ["dsn-canberra"]),
    ]
    _assert_covers(windows, _h(0), _h(24))


def test_link_windows_without_earth_are_one_relay_window() -> None:
    station_view = {"dsn-madrid": [(_h(1), _h(6))]}

    windows = stations.link_windows(_h(0), _h(24), [], station_view)

    assert windows == [{"start_utc": _h(0), "end_utc": _h(24), "mode": "relay_needed", "station_ids": []}]


def test_load_stations_rejects_a_malformed_file(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(stations.catalog, "load_ground_stations", lambda: [{"id": "dsn-x"}])
    with pytest.raises(DataUnavailable):
        stations.load_stations()
