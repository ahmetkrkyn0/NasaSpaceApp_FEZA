"""Response models for ``GET /api/body-series`` (ADR-0003, ``BodySeries``)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.models.common import Validity


class BodySample(BaseModel):
    """Sub-solar and sub-Earth points on the Moon at one instant."""

    utc: str
    sub_solar_lat_deg: float
    sub_solar_lon_deg: float
    sub_earth_lat_deg: float
    sub_earth_lon_deg: float
    earth_distance_km: float


class BodySeries(BaseModel):
    """Where the Sun and the Earth stand over the Moon over a time range."""

    frame: Literal["MOON_ME"]
    samples: list[BodySample]
    validity: Validity
