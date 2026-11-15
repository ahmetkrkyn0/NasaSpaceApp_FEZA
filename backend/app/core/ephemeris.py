"""SPICE wrapper for lunar observer geometry.

Every spiceypy call is serialised through a module-level lock because SPICE
keeps global state and FastAPI runs synchronous endpoints in a thread pool.
"""

from __future__ import annotations

import math
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal, Sequence

import spiceypy
from spiceypy.utils.exceptions import SpiceyError

from app.errors import DataUnavailable, DateOutOfRange, InvalidParameter
from app.settings import KERNEL_FILES, get_settings

MOON_RADIUS_KM = 1737.4
AU_KM = 149597870.7

WGS84_A_KM = 6378.137
WGS84_F = 1.0 / 298.257223563
"""WGS 84 ellipsoid: the datum of the DSN station coordinates (DSN 810-005, 301, Table 5)."""

EARTH_FRAME = "IAU_EARTH"
"""Earth orientation from the text PCK in the kernel set: no nutation, no UT1 correction."""

EPHEMERIS_INFO = {
    "source": "SPICE DE440",
    "frame": "MOON_ME",
    "correction": "LT+S",
}

_LOCK = threading.Lock()
_loaded_dir: Path | None = None
_range_cache: dict[Path, tuple[datetime, datetime]] = {}

_COVERAGE_BODIES = (10, 399, 301)


@dataclass(frozen=True)
class BodyPosition:
    """Apparent position of a body as seen from a lunar observer."""

    azimuth_true_deg: float
    elevation_deg: float
    range_km: float
    radius_deg: float


@dataclass(frozen=True)
class SubPoints:
    """Sub-solar and sub-Earth points on the Moon at one instant (``MOON_ME``).

    Seen from the Moon's centre with the ``LT+S`` correction, so the Sun and
    the Earth are where they appear from the Moon at that instant. On the
    1737.4 km reference sphere the sub-point is the direction to the body.
    """

    sub_solar_lat_deg: float
    sub_solar_lon_deg: float
    sub_earth_lat_deg: float
    sub_earth_lon_deg: float
    earth_distance_km: float
    earth_sub_lunar_lat_deg: float
    earth_sub_lunar_lon_deg: float
    earth_sub_solar_lat_deg: float
    earth_sub_solar_lon_deg: float
    """Earth-fixed (``IAU_EARTH``) points below the Moon and below the Sun, for the
    Earth as it appears from the Moon at that instant: the Earth's orientation
    is taken one light time (about 1.3 s) earlier, and the Sun is seen from the
    Earth with ``LT+S``. Latitudes are planetocentric (the direction from the
    Earth's centre), longitudes east positive in [-180, 180)."""


def _ensure_loaded_locked(kernel_dir: Path) -> None:
    """Load the kernels from ``kernel_dir``; the caller holds the lock."""

    global _loaded_dir

    if _loaded_dir == kernel_dir:
        return

    spiceypy.kclear()
    _loaded_dir = None

    missing = [name for name in KERNEL_FILES if not (kernel_dir / name).is_file()]
    if missing:
        raise DataUnavailable(
            f"SPICE kernels missing in {kernel_dir}: {', '.join(missing)}. "
            "Run python backend/scripts/download_kernels.py"
        )

    try:
        for name in KERNEL_FILES:
            spiceypy.furnsh(str((kernel_dir / name).resolve()))
        _smoke_test_locked()
    except (SpiceyError, OSError, ValueError) as exc:
        spiceypy.kclear()
        raise DataUnavailable(
            f"SPICE kernels in {kernel_dir} could not be loaded ({_first_line(exc)}). "
            "Run python backend/scripts/download_kernels.py --force"
        ) from None

    _loaded_dir = kernel_dir


def _smoke_test_locked() -> None:
    """Prove the loaded kernels hold usable data; the caller holds the lock.

    ``furnsh`` can accept a file that is not a kernel without raising, so the
    loaded set is exercised once: the LSK for ``str2et``, the SPK, FK and binary
    PCK for ``spkpos`` in ``MOON_ME``, and the text PCK for ``bodvrd``.
    """

    et = spiceypy.str2et("2026-01-01T00:00:00")
    spiceypy.spkpos("SUN", et, "MOON_ME", "NONE", "MOON")
    spiceypy.spkpos("EARTH", et, "MOON_ME", "NONE", "MOON")
    spiceypy.bodvrd("SUN", "RADII", 3)
    spiceypy.bodvrd("EARTH", "RADII", 3)


def _first_line(exc: Exception) -> str:
    """First non-empty line of an error, enough to name the failing file."""

    lines = [line.strip() for line in str(exc).splitlines() if line.strip()]
    return lines[0] if lines else type(exc).__name__


def _unusable(kernel_dir: Path, exc: Exception) -> DataUnavailable:
    """Drop the loaded kernels so the next call retries; the caller holds the lock."""

    global _loaded_dir
    spiceypy.kclear()
    _loaded_dir = None
    _range_cache.pop(kernel_dir, None)
    return DataUnavailable(f"SPICE kernels in {kernel_dir} are unusable ({_first_line(exc)}).")


def ensure_loaded() -> None:
    """Load the configured SPICE kernels, reloading when the directory changes."""

    kernel_dir = get_settings().kernel_dir
    with _LOCK:
        _ensure_loaded_locked(kernel_dir)


def kernels_loaded() -> bool:
    """Return True when the configured kernels can be loaded."""

    try:
        ensure_loaded()
    except DataUnavailable:
        return False
    return True


def _et_to_datetime(et: float) -> datetime:
    """Convert an ephemeris time to a tz-aware UTC datetime."""

    text = spiceypy.et2utc(et, "ISOC", 0)
    return datetime.fromisoformat(text).replace(tzinfo=timezone.utc)


def _ceil_day(moment: datetime) -> datetime:
    """Round ``moment`` up to the next 00:00:00 UTC."""

    midnight = moment.replace(hour=0, minute=0, second=0, microsecond=0)
    if midnight < moment:
        midnight += timedelta(days=1)
    return midnight


def _floor_day(moment: datetime) -> datetime:
    """Round ``moment`` down to 00:00:00 UTC."""

    return moment.replace(hour=0, minute=0, second=0, microsecond=0)


def ephemeris_range() -> tuple[datetime, datetime]:
    """Return the computable UTC range shared by Sun, Earth and Moon coverage."""

    ensure_loaded()
    kernel_dir = get_settings().kernel_dir
    cached = _range_cache.get(kernel_dir)
    if cached is not None:
        return cached
    kernel_path = str((kernel_dir / "de440s.bsp").resolve())

    with _LOCK:
        try:
            cover = None
            for body in _COVERAGE_BODIES:
                body_cover = spiceypy.spkcov(kernel_path, body)
                cover = body_cover if cover is None else spiceypy.wnintd(cover, body_cover)
            start_et, end_et = spiceypy.wnfetd(cover, 0)
            start = _et_to_datetime(start_et)
            end = _et_to_datetime(end_et)
        except (SpiceyError, ValueError) as exc:
            raise _unusable(kernel_dir, exc) from None

    start = _ceil_day(start + timedelta(days=1))
    end = _floor_day(end - timedelta(days=1))
    _range_cache[kernel_dir] = (start, end)
    return start, end


def to_spice_utc(dt: datetime) -> str:
    """Format ``dt`` for SPICE without a timezone suffix (ADR-0002 rule 7).

    Fractional seconds are kept (``...:00.5``) so the computed instant is the requested one.
    """

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    text = dt.strftime("%Y-%m-%dT%H:%M:%S")
    if dt.microsecond:
        text += f".{dt.microsecond:06d}".rstrip("0")
    return text


def format_utc(dt: datetime) -> str:
    """Format ``dt`` as an ISO 8601 UTC timestamp ending in ``Z``; fractions only when present."""

    return f"{to_spice_utc(dt)}Z"


def parse_utc(text: str, name: str = "utc") -> datetime:
    """Parse an ISO 8601 UTC timestamp ending in ``Z`` (ADR-0002 rule 5) into a tz-aware datetime.

    Offsets such as ``+03:00`` and times without a zone are rejected so a
    request cannot silently mean a different instant. ``name`` is the
    parameter named in the error message.
    """

    error = InvalidParameter(
        f"Invalid parameter '{name}': '{text}' must be an ISO 8601 UTC time ending in Z, "
        "e.g. 2026-12-01T00:00:00Z."
    )
    if not isinstance(text, str) or not text.strip().upper().endswith("Z"):
        raise error
    try:
        parsed = datetime.fromisoformat(text.strip()[:-1] + "+00:00")
    except ValueError:
        raise error from None
    return parsed.astimezone(timezone.utc)


def _checked_times(times: Sequence[datetime]) -> list[datetime]:
    """Return ``times`` as UTC datetimes; raise ``DateOutOfRange`` outside the kernels."""

    start, end = ephemeris_range()

    normalized: list[datetime] = []
    for moment in times:
        if moment.tzinfo is None:
            moment = moment.replace(tzinfo=timezone.utc)
        else:
            moment = moment.astimezone(timezone.utc)
        if moment < start or moment > end:
            raise DateOutOfRange(
                f"Date {format_utc(moment)} is outside the computable range "
                f"{format_utc(start)} to {format_utc(end)}."
            )
        normalized.append(moment)
    return normalized


def wrap_lon_deg(lon_deg: float) -> float:
    """Wrap a longitude into [-180, 180) degrees (ADR-0002 rule 3)."""

    return (lon_deg + 180.0) % 360.0 - 180.0


def sub_points(times: Sequence[datetime]) -> list[SubPoints]:
    """Return the sub-solar and sub-Earth points for every time in ``times``."""

    normalized = _checked_times(times)

    with _LOCK:
        try:
            return _sub_points_locked(normalized)
        except SpiceyError as exc:
            raise _unusable(get_settings().kernel_dir, exc) from None


def _sub_points_locked(times: Sequence[datetime]) -> list[SubPoints]:
    """SPICE part of ``sub_points``; the caller holds the lock."""

    results: list[SubPoints] = []
    for moment in times:
        et = spiceypy.str2et(to_spice_utc(moment))
        sun, _ = spiceypy.spkpos("SUN", et, "MOON_ME", "LT+S", "MOON")
        earth, _ = spiceypy.spkpos("EARTH", et, "MOON_ME", "LT+S", "MOON")
        _, sun_lon, sun_lat = spiceypy.reclat(sun)
        earth_range, earth_lon, earth_lat = spiceypy.reclat(earth)
        # The Earth as seen from the Moon: its state one light time earlier.
        earth_j2000, light_time = spiceypy.spkpos("EARTH", et, "J2000", "LT+S", "MOON")
        et_earth = et - light_time
        to_earth_fixed = spiceypy.pxform("J2000", EARTH_FRAME, et_earth)
        moon_dir = spiceypy.mxv(to_earth_fixed, [-c for c in earth_j2000])
        sun_j2000, _ = spiceypy.spkpos("SUN", et_earth, "J2000", "LT+S", "EARTH")
        sun_dir = spiceypy.mxv(to_earth_fixed, sun_j2000)
        _, lunar_lon, lunar_lat = spiceypy.reclat(moon_dir)
        _, esun_lon, esun_lat = spiceypy.reclat(sun_dir)
        results.append(
            SubPoints(
                sub_solar_lat_deg=math.degrees(sun_lat),
                sub_solar_lon_deg=wrap_lon_deg(math.degrees(sun_lon)),
                sub_earth_lat_deg=math.degrees(earth_lat),
                sub_earth_lon_deg=wrap_lon_deg(math.degrees(earth_lon)),
                earth_distance_km=float(earth_range),
                earth_sub_lunar_lat_deg=math.degrees(lunar_lat),
                earth_sub_lunar_lon_deg=wrap_lon_deg(math.degrees(lunar_lon)),
                earth_sub_solar_lat_deg=math.degrees(esun_lat),
                earth_sub_solar_lon_deg=wrap_lon_deg(math.degrees(esun_lon)),
            )
        )
    return results


def moon_elevations_from_earth(
    lat_deg: float,
    lon_deg: float,
    height_m: float,
    times: Sequence[datetime],
) -> list[float]:
    """Elevation of the Moon's centre seen from a point on Earth, in degrees, for every time.

    The point is geodetic on the WGS 84 ellipsoid; elevation is above the plane
    normal to the ellipsoid there. The Earth turns with ``IAU_EARTH`` and the
    Moon's position uses ``LT+S``; no atmospheric refraction.
    """

    normalized = _checked_times(times)

    with _LOCK:
        try:
            return _moon_elevations_locked(lat_deg, lon_deg, height_m, normalized)
        except SpiceyError as exc:
            raise _unusable(get_settings().kernel_dir, exc) from None


def _moon_elevations_locked(
    lat_deg: float,
    lon_deg: float,
    height_m: float,
    times: Sequence[datetime],
) -> list[float]:
    """SPICE part of ``moon_elevations_from_earth``; the caller holds the lock."""

    station = spiceypy.georec(
        math.radians(lon_deg), math.radians(lat_deg), height_m / 1000.0, WGS84_A_KM, WGS84_F
    )
    elevations: list[float] = []
    for moment in times:
        et = spiceypy.str2et(to_spice_utc(moment))
        state, _light_time = spiceypy.azlcpo(
            "ELLIPSOID", "MOON", et, "LT+S", False, True, station, "EARTH", EARTH_FRAME
        )
        elevations.append(math.degrees(state[2]))
    return elevations


def body_positions(
    lat_deg: float,
    lon_deg: float,
    height_m: float,
    times: Sequence[datetime],
    body: Literal["SUN", "EARTH"],
) -> list[BodyPosition]:
    """Return the apparent position of ``body`` for every time in ``times``."""

    normalized = _checked_times(times)

    with _LOCK:
        try:
            return _positions_locked(lat_deg, lon_deg, height_m, normalized, body)
        except SpiceyError as exc:
            raise _unusable(get_settings().kernel_dir, exc) from None


def _positions_locked(
    lat_deg: float,
    lon_deg: float,
    height_m: float,
    times: Sequence[datetime],
    body: str,
) -> list[BodyPosition]:
    """SPICE part of ``body_positions``; the caller holds the lock."""

    observer = spiceypy.latrec(
        MOON_RADIUS_KM + height_m / 1000.0,
        math.radians(lon_deg),
        math.radians(lat_deg),
    )
    _, radii = spiceypy.bodvrd(body, "RADII", 3)
    body_radius_km = float(radii[0])

    positions: list[BodyPosition] = []
    for moment in times:
        et = spiceypy.str2et(to_spice_utc(moment))
        state, _light_time = spiceypy.azlcpo(
            "ELLIPSOID",
            body,
            et,
            "LT+S",
            False,
            True,
            observer,
            "MOON",
            "MOON_ME",
        )
        azimuth_deg = math.degrees(state[1]) % 360.0
        elevation_deg = math.degrees(state[2])
        range_km = float(state[0])
        radius_deg = math.degrees(math.asin(min(1.0, body_radius_km / range_km)))
        positions.append(
            BodyPosition(
                azimuth_true_deg=azimuth_deg,
                elevation_deg=elevation_deg,
                range_km=range_km,
                radius_deg=radius_deg,
            )
        )

    return positions
