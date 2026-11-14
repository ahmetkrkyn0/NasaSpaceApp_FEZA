"""Resolve a request location from a site id or explicit coordinates."""

from __future__ import annotations

import math
from dataclasses import dataclass

from app.core import catalog
from app.errors import InvalidParameter, SiteNotFound


@dataclass(frozen=True)
class Location:
    """A resolved observer location on the Moon."""

    lat_deg: float
    lon_deg: float
    site_id: str | None
    elevation_m: float | None
    site: dict | None


def normalize_lon(lon_deg: float) -> float:
    """Map a longitude in degrees into the closed range [-180, 180]."""

    normalized = (lon_deg + 180.0) % 360.0 - 180.0
    if normalized == -180.0 and lon_deg > 0.0:
        normalized = 180.0
    return round(normalized, 10)


def _validate_lat(lat_deg: float) -> float:
    if math.isnan(lat_deg) or not -90.0 <= lat_deg <= 90.0:
        raise InvalidParameter(
            f"Invalid parameter 'lat_deg': must be between -90 and 90, got {lat_deg}."
        )
    return lat_deg


def _validate_lon(lon_deg: float) -> float:
    if math.isnan(lon_deg) or not -180.0 <= lon_deg <= 360.0:
        raise InvalidParameter(
            f"Invalid parameter 'lon_deg': must be between -180 and 360, got {lon_deg}."
        )
    return lon_deg


def resolve(
    site_id: str | None = None,
    lat_deg: float | None = None,
    lon_deg: float | None = None,
) -> Location:
    """Resolve a location from ``site_id`` or from ``lat_deg`` and ``lon_deg``."""

    if site_id is not None:
        site = catalog.find_site(site_id)
        if site is None:
            raise SiteNotFound(f"No site with id '{site_id}'.")
        return Location(
            lat_deg=float(site["lat_deg"]),
            lon_deg=normalize_lon(float(site["lon_deg"])),
            site_id=site_id,
            elevation_m=site.get("elevation_m"),
            site=site,
        )

    if lat_deg is None or lon_deg is None:
        raise InvalidParameter("Give site_id or both lat_deg and lon_deg.")

    lat = _validate_lat(float(lat_deg))
    lon = _validate_lon(float(lon_deg))

    return Location(
        lat_deg=lat,
        lon_deg=normalize_lon(lon),
        site_id=None,
        elevation_m=None,
        site=None,
    )
