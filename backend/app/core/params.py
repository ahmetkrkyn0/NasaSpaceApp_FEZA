"""Shared checks for request parameters (ADR-0004, "Sınırlar" and "Hata yanıtı")."""

from __future__ import annotations

import math
from datetime import datetime

from app.core import ephemeris
from app.errors import InvalidParameter

CRITERIA = ("center", "first_limb", "full_disk")
DEFAULT_MAST_HEIGHT_M = 2.0
MAX_HOURS = 24 * 60


def rounded(value: float | None, digits: int) -> float | None:
    """``round`` that lets ``None`` through."""

    return None if value is None else round(float(value), digits)


def utc_or_none(moment: datetime | None) -> str | None:
    """ISO 8601 UTC text, or ``None``."""

    return None if moment is None else ephemeris.format_utc(moment)


def check_criterion(value: str | None) -> str:
    """Return the Earth visibility criterion; ``None`` means ``center``."""

    if value is None:
        return "center"
    if value not in CRITERIA:
        raise InvalidParameter(
            f"Invalid parameter 'earth_criterion': must be one of {', '.join(CRITERIA)}, got '{value}'."
        )
    return value


def check_mast_height(value: float | None, name: str = "mast_height_m") -> float | None:
    """Reject negative or non-finite mast heights; ``None`` passes through."""

    if value is None:
        return None
    if not math.isfinite(value) or value < 0:
        raise InvalidParameter(f"Invalid parameter '{name}': must be >= 0, got {value}.")
    return float(value)


def resolve_mast_height(requested: float | None, profile: dict | None = None) -> float:
    """Mast height rule of ADR-0003: request value, else panel profile value, else 2 m."""

    if requested is not None:
        return float(requested)
    if profile is not None and profile.get("mast_height_m") is not None:
        return check_mast_height(float(profile["mast_height_m"]))
    return DEFAULT_MAST_HEIGHT_M


def parse_time(name: str, text: str | None) -> datetime:
    """Parse a required UTC parameter, naming it in the error message."""

    if text is None:
        raise InvalidParameter(f"Invalid parameter '{name}': required.")
    return ephemeris.parse_utc(text, name)


def check_interval(start: datetime, end: datetime, max_hours: float = MAX_HOURS) -> None:
    """``end`` must be after ``start`` and at most ``max_hours`` later."""

    hours = (end - start).total_seconds() / 3600.0
    if hours <= 0:
        raise InvalidParameter("Invalid parameter 'end_utc': must be after start_utc.")
    if hours > max_hours:
        raise InvalidParameter(
            f"Invalid parameter 'end_utc': the range may be at most {max_hours:g} hours, got {hours:g}."
        )
