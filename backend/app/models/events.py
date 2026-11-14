"""Response models for ``/api/events``, ``/api/now`` and ``/api/comm-window`` (ADR-0003)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.models.common import Validity

Criterion = Literal["center", "first_limb", "full_disk"]
RelayStatus = Literal["not_required", "intermittent", "required", "unknown"]


class SkyEvent(BaseModel):
    """A rise or set; ``utc_earliest``/``utc_latest`` show sensitivity to a one-arcminute horizon shift."""

    type: Literal["sunrise", "sunset", "earthrise", "earthset", "eclipse_start", "eclipse_end"]
    utc: str
    utc_earliest: str | None
    utc_latest: str | None
    criterion: Criterion
    max_obscured_fraction: float | None = None
    """Eclipse events only: the largest covered share of the Sun's disk (ADR-0003, extra field)."""


class EventWindow(BaseModel):
    """A stretch of time between two events, cut at the query ends."""

    kind: Literal["sunlit", "dark", "earth_visible", "earth_hidden"]
    start_utc: str
    end_utc: str
    duration_hours: float


class EventMetrics(BaseModel):
    """Summary of the queried range."""

    sunlit_fraction: float | None
    longest_dark_hours: float | None
    max_sun_elevation_deg: float | None
    earth_visible_fraction: float | None
    longest_earth_hidden_hours: float | None


class EventList(BaseModel):
    """``GET /api/events``."""

    events: list[SkyEvent]
    windows: list[EventWindow]
    metrics: EventMetrics
    mast_height_m: float
    relay_status: RelayStatus | None = None
    """Extra field of ADR-0003 (role-etiketi.md); left out of ``/api/eclipses``."""
    relay_required: bool | None = None
    validity: Validity


class NowStatus(BaseModel):
    """``GET /api/now``; durations in hours."""

    utc: str
    sun_up: bool | None
    hours_to_sunset: float | None
    hours_to_sunrise: float | None
    earth_up: bool | None
    hours_to_earthset: float | None
    hours_to_earthrise: float | None
    night_hours: float | None
    criterion: Criterion
    mast_height_m: float
    search_limited: bool
    validity: Validity


class CommWindow(BaseModel):
    """``GET /api/comm-window``; durations in minutes."""

    utc: str
    lat_deg: float
    lon_deg: float
    mast_height_m: float
    visible_now: bool
    minutes_remaining: float | None
    minutes_until_visible: float | None
    next_change_utc: str | None
    search_limited: bool
    searched_hours: float
    earth_elevation_deg: float | None
    earth_azimuth_true_deg: float | None
    horizon_deg: float
    criterion: Criterion
    relay_status: RelayStatus | None = None
    """Extra field of ADR-0003 (role-etiketi.md)."""
    relay_required: bool | None = None
    validity: Validity
