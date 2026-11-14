"""Response models for ``GET /api/sky-series`` (ADR-0003, ``SkySeries``)."""

from __future__ import annotations

from pydantic import BaseModel

from app.models.common import Validity


class EphemerisInfo(BaseModel):
    """Where the positions come from."""

    source: str
    frame: str
    correction: str


class HorizonInfo(BaseModel):
    """The horizon profile used for ``horizon_deg`` and ``visible_fraction``."""

    method: str
    validity: Validity


class SunSample(BaseModel):
    """Sun position seen from the site at one instant."""

    azimuth_true_deg: float
    elevation_deg: float
    horizon_deg: float
    visible_fraction: float
    range_au: float
    radius_deg: float


class EarthSample(BaseModel):
    """Earth position seen from the site at one instant."""

    azimuth_true_deg: float
    elevation_deg: float
    horizon_deg: float
    visible_fraction: float
    range_km: float
    radius_deg: float


class SkySample(BaseModel):
    """Sun and Earth at one instant."""

    utc: str
    sun: SunSample
    earth: EarthSample


class SkySeries(BaseModel):
    """Sun and Earth positions over a time range for one observer."""

    lat_deg: float
    lon_deg: float
    mast_height_m: float
    start_utc: str
    step_minutes: int
    samples: list[SkySample]
    ephemeris: EphemerisInfo
    horizon: HorizonInfo
    validity: Validity
