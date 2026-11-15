"""Response models for ``GET /api/ground-stations`` and ``GET /api/earth-link`` (#97, 4.2)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.models.common import Validity

LinkMode = Literal["direct", "relay_needed", "no_station"]


class StationSource(BaseModel):
    """Where a station's coordinates come from."""

    label: str
    url: str


class GroundStation(BaseModel):
    """An Earth ground station (``data/ground_stations.json``)."""

    id: str
    name: str
    lat_deg: float
    lon_deg: float
    elevation_m: float
    source: StationSource
    validity: Validity


class TimeWindow(BaseModel):
    """A time interval; both ends are ISO 8601 UTC."""

    start_utc: str
    end_utc: str


class StationView(BaseModel):
    """When one station sees the Moon above the minimum elevation."""

    id: str
    name: str
    in_view_fraction: float
    windows: list[TimeWindow]


class LinkWindow(BaseModel):
    """A stretch of the range with one link mode."""

    start_utc: str
    end_utc: str
    mode: LinkMode
    station_ids: list[str]


class EarthLink(BaseModel):
    """Direct-to-Earth link windows: site view of Earth combined with station view of the Moon."""

    min_station_elevation_deg: float
    stations: list[StationView]
    link_windows: list[LinkWindow]
    assumptions: list[str]
    validity: Validity
