"""Reference tests for the SPICE ephemeris wrapper (app.core.ephemeris).

The expected values come from the real DE440 kernels in ``data/raw/kernels``
and were verified with the exact ``azlcpo`` call described in the F1-A spec.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from app.core import ephemeris
from app.errors import DataUnavailable, DateOutOfRange, InvalidParameter

ANGLE_TOL_DEG = 0.01


def _utc(text: str) -> datetime:
    """Parse an ISO 8601 UTC string into a tz-aware datetime."""
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def _assert_azimuth(actual: float, expected: float) -> None:
    """Compare azimuths modulo 360 so 0 and 360 are the same direction."""
    diff = abs((actual - expected + 180.0) % 360.0 - 180.0)
    assert diff == pytest.approx(0.0, abs=ANGLE_TOL_DEG)


SUN_REFERENCE_CASES = [
    ("IM-2 Athena", "2025-03-06T17:30:00Z", -84.7906, 29.1957, 65.67, 2.47),
    ("Blue Ghost 1", "2025-03-02T08:34:00Z", 18.562, 61.810, 91.62, 3.43),
    ("Chandrayaan-3", "2023-08-23T12:34:00Z", -69.373, 32.319, 62.04, 8.61),
    ("IM-1", "2024-02-22T23:23:00Z", -80.13, 1.44, 18.61, 10.47),
    ("SLIM", "2024-01-19T15:20:00Z", -13.3, 25.2, 81.66, 37.16),
    ("Chang'e 4", "2019-01-03T02:26:00Z", -45.4446, 177.5991, 50.70, 31.51),
]


@pytest.mark.parametrize(
    ("utc", "lat_deg", "lon_deg", "azimuth_deg", "elevation_deg"),
    [case[1:] for case in SUN_REFERENCE_CASES],
    ids=[case[0] for case in SUN_REFERENCE_CASES],
)
def test_sun_position_matches_reference_missions(
    utc: str,
    lat_deg: float,
    lon_deg: float,
    azimuth_deg: float,
    elevation_deg: float,
) -> None:
    positions = ephemeris.body_positions(lat_deg, lon_deg, 0.0, [_utc(utc)], "SUN")

    assert len(positions) == 1
    position = positions[0]
    _assert_azimuth(position.azimuth_true_deg, azimuth_deg)
    assert position.elevation_deg == pytest.approx(elevation_deg, abs=ANGLE_TOL_DEG)


def test_earth_position_at_athena() -> None:
    positions = ephemeris.body_positions(
        -84.7906, 29.1957, 0.0, [_utc("2025-03-06T17:30:00Z")], "EARTH"
    )

    assert len(positions) == 1
    position = positions[0]
    _assert_azimuth(position.azimuth_true_deg, 335.85)
    assert position.elevation_deg == pytest.approx(11.19, abs=ANGLE_TOL_DEG)


def test_earth_elevation_at_change_4() -> None:
    positions = ephemeris.body_positions(
        -45.4446, 177.5991, 0.0, [_utc("2019-01-03T02:26:00Z")], "EARTH"
    )

    assert len(positions) == 1
    assert positions[0].elevation_deg == pytest.approx(-39.20, abs=ANGLE_TOL_DEG)


def test_sun_and_earth_elevation_extremes_over_a_lunar_month() -> None:
    start = _utc("2026-12-01T00:00:00Z")
    times = [start + timedelta(hours=12 * k) for k in range(61)]

    sun_positions = ephemeris.body_positions(-84.78, 29.13, 0.0, times, "SUN")
    earth_positions = ephemeris.body_positions(-84.78, 29.13, 0.0, times, "EARTH")

    assert len(sun_positions) == len(times)
    assert len(earth_positions) == len(times)

    sun_elevations = [position.elevation_deg for position in sun_positions]
    max_sun_index = max(range(len(sun_elevations)), key=sun_elevations.__getitem__)
    assert sun_elevations[max_sun_index] == pytest.approx(6.47, abs=ANGLE_TOL_DEG)
    assert times[max_sun_index] == _utc("2026-12-21T12:00:00Z")

    earth_elevations = [position.elevation_deg for position in earth_positions]
    assert min(earth_elevations) == pytest.approx(-2.10, abs=ANGLE_TOL_DEG)
    assert max(earth_elevations) == pytest.approx(10.65, abs=ANGLE_TOL_DEG)


def test_angular_radius_and_range_at_athena() -> None:
    time = _utc("2025-03-06T17:30:00Z")

    sun = ephemeris.body_positions(-84.7906, 29.1957, 0.0, [time], "SUN")[0]
    earth = ephemeris.body_positions(-84.7906, 29.1957, 0.0, [time], "EARTH")[0]

    assert 0.25 <= sun.radius_deg <= 0.28
    assert 0.88 <= earth.radius_deg <= 1.03
    assert 0.97 <= sun.range_km / ephemeris.AU_KM <= 1.03


def test_ephemeris_range_is_tz_aware_and_matches_kernel_coverage() -> None:
    start, end = ephemeris.ephemeris_range()

    assert start.tzinfo is not None
    assert end.tzinfo is not None
    assert start.utcoffset() == timedelta(0)
    assert end.utcoffset() == timedelta(0)
    assert start.year == 1849
    assert end.year == 2150
    assert start < end


def test_to_spice_utc_has_no_suffix() -> None:
    text = ephemeris.to_spice_utc(_utc("2025-03-06T17:30:00Z"))

    assert text == "2025-03-06T17:30:00"
    assert "UTC" not in text
    assert "Z" not in text


def test_fractional_seconds_are_kept() -> None:
    moment = _utc("2025-03-06T17:30:00.25Z")

    assert ephemeris.to_spice_utc(moment) == "2025-03-06T17:30:00.25"
    assert ephemeris.format_utc(moment) == "2025-03-06T17:30:00.25Z"
    assert ephemeris.format_utc(_utc("2025-03-06T17:30:00Z")) == "2025-03-06T17:30:00Z"

    whole, fraction = (
        ephemeris.body_positions(-84.7906, 29.1957, 0.0, [t], "EARTH")[0]
        for t in (_utc("2025-03-06T17:30:00Z"), _utc("2025-03-06T17:30:30.5Z"))
    )
    assert whole.azimuth_true_deg != fraction.azimuth_true_deg


def test_parse_utc_accepts_z_suffix() -> None:
    expected = datetime(2025, 3, 6, 17, 30, tzinfo=timezone.utc)

    from_z = ephemeris.parse_utc("2025-03-06T17:30:00Z")

    assert from_z == expected
    assert from_z.utcoffset() == timedelta(0)


@pytest.mark.parametrize(
    "text", ["2025-03-06T17:30:00", "2025-03-06T17:30:00+03:00", "2025-03-06T17:30:00+00:00"]
)
def test_parse_utc_rejects_times_without_z(text: str) -> None:
    with pytest.raises(InvalidParameter) as excinfo:
        ephemeris.parse_utc(text, "start_utc")
    assert "'start_utc'" in excinfo.value.message


def test_parse_utc_rejects_bad_text() -> None:
    with pytest.raises(InvalidParameter):
        ephemeris.parse_utc("bad")


def test_body_positions_rejects_date_outside_range() -> None:
    with pytest.raises(DateOutOfRange) as excinfo:
        ephemeris.body_positions(
            -84.7906, 29.1957, 0.0, [_utc("2200-01-01T00:00:00Z")], "SUN"
        )

    message = str(excinfo.value)
    assert "1849" in message
    assert "2150" in message


def test_corrupt_kernels_raise_data_unavailable(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    from app.settings import KERNEL_FILES

    for name in KERNEL_FILES:
        (tmp_path / name).write_bytes(b"not a SPICE kernel\n")
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(tmp_path))

    with pytest.raises(DataUnavailable):
        ephemeris.ensure_loaded()
    assert ephemeris.kernels_loaded() is False

    monkeypatch.delenv("FEZA_KERNEL_DIR", raising=False)
    assert ephemeris.kernels_loaded() is True


def test_kernels_that_load_silently_but_hold_no_data_raise_data_unavailable(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    from app.settings import KERNEL_FILES

    for name in KERNEL_FILES:
        (tmp_path / name).write_bytes(b"not a SPICE kernel\n")
    monkeypatch.setattr(ephemeris.spiceypy, "furnsh", lambda path: None)
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(tmp_path))

    with pytest.raises(DataUnavailable):
        ephemeris.ensure_loaded()
    assert ephemeris.kernels_loaded() is False

    monkeypatch.undo()
    assert ephemeris.kernels_loaded() is True


def test_missing_kernels_raise_and_real_kernels_reload(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(tmp_path))

    with pytest.raises(DataUnavailable):
        ephemeris.ensure_loaded()
    assert ephemeris.kernels_loaded() is False

    monkeypatch.delenv("FEZA_KERNEL_DIR", raising=False)

    ephemeris.ensure_loaded()
    assert ephemeris.kernels_loaded() is True
