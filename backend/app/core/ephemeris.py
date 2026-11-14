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

    for name in KERNEL_FILES:
        spiceypy.furnsh(str((kernel_dir / name).resolve()))

    _loaded_dir = kernel_dir


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
        cover = None
        for body in _COVERAGE_BODIES:
            body_cover = spiceypy.spkcov(kernel_path, body)
            cover = body_cover if cover is None else spiceypy.wnintd(cover, body_cover)
        start_et, end_et = spiceypy.wnfetd(cover, 0)
        start = _et_to_datetime(start_et)
        end = _et_to_datetime(end_et)

    start = _ceil_day(start + timedelta(days=1))
    end = _floor_day(end - timedelta(days=1))
    _range_cache[kernel_dir] = (start, end)
    return start, end


def to_spice_utc(dt: datetime) -> str:
    """Format ``dt`` for SPICE without a timezone suffix (ADR-0002 rule 7)."""

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")


def format_utc(dt: datetime) -> str:
    """Format ``dt`` as an ISO 8601 UTC timestamp ending in ``Z``."""

    return f"{to_spice_utc(dt)}Z"


def parse_utc(text: str) -> datetime:
    """Parse an ISO 8601 timestamp into a tz-aware UTC datetime."""

    try:
        parsed = datetime.fromisoformat(text.strip().replace("Z", "+00:00"))
    except (AttributeError, TypeError, ValueError):
        raise InvalidParameter(
            f"Invalid parameter 'utc': cannot parse '{text}' as an ISO 8601 timestamp."
        ) from None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
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
        observer = spiceypy.latrec(
            MOON_RADIUS_KM + height_m / 1000.0,
            math.radians(lon_deg),
            math.radians(lat_deg),
        )
        _, radii = spiceypy.bodvrd(body, "RADII", 3)
        body_radius_km = float(radii[0])

        positions: list[BodyPosition] = []
        for moment in normalized:
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
