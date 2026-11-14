"""Response model for ``/api/power`` (ADR-0003, ``PowerSeries``)."""

from __future__ import annotations

from pydantic import BaseModel

from app.models.common import Validity


class PowerSample(BaseModel):
    """Panel power at one instant."""

    utc: str
    incidence_cos: float
    sun_visible_fraction: float
    irradiance_w_m2: float
    power_w: float


class PowerSummary(BaseModel):
    """Summary over the range."""

    mean_power_w: float | None
    energy_kwh: float | None
    sunlit_fraction: float | None
    longest_dark_hours: float | None


class PowerSeries(BaseModel):
    """``GET /api/power``."""

    panel_profile_id: str
    mast_height_m: float
    fixed_azimuth_deg: float | None
    samples: list[PowerSample]
    summary: PowerSummary
    validity: Validity
