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


def body_positions(
    lat_deg: float,
    lon_deg: float,
    height_m: float,
    times: Sequence[datetime],
    body: Literal["SUN", "EARTH"],
) -> list[BodyPosition]:
    """Return the apparent position of ``body`` for every time in ``times``."""

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
