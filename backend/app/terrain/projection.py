"""South polar stereographic projection used by the PGDA 90 height maps.

The height maps (and every map layer built on them) use a polar
stereographic projection centred on the south pole, true scale at the pole,
on the 1737.4 km reference sphere, with x and y in metres (ADR-0004, map
layers; dogrulama/veri-kaynaklari.md, No 17 and 19). The GeoTIFF header
reads: ``Polar_Stereographic``, ``latitude_of_origin -90``,
``central_meridian 0``, no false easting or northing.

Longitude is east-positive. With these parameters the 0 degree meridian runs
along +y and the 90 degree east meridian along +x.
"""

from __future__ import annotations

import math

import numpy as np

MOON_RADIUS_M = 1_737_400.0
"""Reference sphere radius (ADR-0002, rule 2)."""


def normalize_lon(lon_deg):
    """Wrap a longitude into [-180, 180) (ADR-0002, rule 3)."""
    lon = np.asarray(lon_deg, dtype=float)
    wrapped = (lon + 180.0) % 360.0 - 180.0
    if np.ndim(wrapped) == 0:
        return float(wrapped)
    return wrapped


def latlon_to_xy(lat_deg, lon_deg, radius_m: float = MOON_RADIUS_M):
    """Latitude and longitude (degrees) to projected x, y (metres).

    Accepts scalars or numpy arrays. The south pole maps to (0, 0).
    """
    lat = np.radians(np.asarray(lat_deg, dtype=float))
    lon = np.radians(np.asarray(lon_deg, dtype=float))
    rho = 2.0 * radius_m * np.tan(np.pi / 4.0 + lat / 2.0)
    x = rho * np.sin(lon)
    y = rho * np.cos(lon)
    if np.ndim(x) == 0:
        return float(x), float(y)
    return x, y


def xy_to_latlon(x_m, y_m, radius_m: float = MOON_RADIUS_M):
    """Projected x, y (metres) back to latitude and longitude (degrees).

    Longitude comes back in [-180, 180). At the pole itself the longitude is
    undefined and 0 is returned.
    """
    x = np.asarray(x_m, dtype=float)
    y = np.asarray(y_m, dtype=float)
    rho = np.hypot(x, y)
    lat = 2.0 * np.arctan(rho / (2.0 * radius_m)) - np.pi / 2.0
    lon = np.arctan2(x, y)
    lat_deg = np.degrees(lat)
    lon_deg = normalize_lon(np.degrees(lon))
    if np.ndim(lat_deg) == 0:
        return float(lat_deg), float(lon_deg)
    return lat_deg, lon_deg


def destination(lat_deg, lon_deg, azimuth_deg, distance_m, radius_m: float = MOON_RADIUS_M):
    """Point reached by walking ``distance_m`` along a great circle.

    ``azimuth_deg`` is measured from true north towards east (ADR-0002,
    rule 8). Inputs broadcast like numpy arrays; outputs are degrees.
    """
    phi1 = math.radians(lat_deg)
    lam1 = math.radians(lon_deg)
    az = np.radians(np.asarray(azimuth_deg, dtype=float))
    delta = np.asarray(distance_m, dtype=float) / radius_m

    sin_phi2 = np.sin(phi1) * np.cos(delta) + np.cos(phi1) * np.sin(delta) * np.cos(az)
    sin_phi2 = np.clip(sin_phi2, -1.0, 1.0)
    phi2 = np.arcsin(sin_phi2)
    lam2 = lam1 + np.arctan2(
        np.sin(az) * np.sin(delta) * np.cos(phi1),
        np.cos(delta) - np.sin(phi1) * sin_phi2,
    )
    return np.degrees(phi2), normalize_lon(np.degrees(lam2))
