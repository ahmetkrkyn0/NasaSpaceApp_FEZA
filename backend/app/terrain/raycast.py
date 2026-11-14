"""Terrain horizon by ray casting over a height map.

Method (docs/design/ufuk-hesabi.md, "Arazi ufku"):

1. The observer sits ``mast_height_m`` above the ground height at the site.
2. 720 rays, one every 0.5 degree, first ray towards north, then east.
3. Samples along each ray: every 20 m up to 3 km, every 2 km beyond 75 km,
   step growing linearly in between, up to 150 km (De Rosa et al. 2012;
   dogrulama/ufuk-ve-isik-isi.md, No A-16).
4. Each sample's view angle is ``atan((dz - d**2 / (2R)) / d)``: the height
   difference minus the curvature drop at that distance, over the distance
   (dogrulama/ufuk-ve-isik-isi.md, No A-10 and A-12).
5. The horizon angle in a direction is the largest view angle on that ray.

Distances are great-circle arc lengths on the reference sphere.
"""

from __future__ import annotations

from typing import Callable

import numpy as np

from .projection import MOON_RADIUS_M, destination

AZIMUTH_STEP_DEG = 0.5
AZIMUTH_COUNT = 720
MAX_RANGE_M = 150_000.0

NEAR_STEP_M = 20.0
NEAR_LIMIT_M = 3_000.0
FAR_STEP_M = 2_000.0
FAR_LIMIT_M = 75_000.0

# (lat_deg array, lon_deg array) -> height array in metres; NaN where unknown.
HeightSampler = Callable[[np.ndarray, np.ndarray], np.ndarray]


def azimuths_deg() -> np.ndarray:
    """The 720 azimuths of a horizon profile: 0, 0.5, ..., 359.5."""
    return np.arange(AZIMUTH_COUNT) * AZIMUTH_STEP_DEG


def curvature_drop_m(distance_m, radius_m: float = MOON_RADIUS_M):
    """How far the sphere falls below the observer's tangent plane.

    About 2.9 km at 100 km (dogrulama/ufuk-ve-isik-isi.md, No A-10).
    """
    d = np.asarray(distance_m, dtype=float)
    return d * d / (2.0 * radius_m)


def sample_distances_m(max_range_m: float = MAX_RANGE_M) -> np.ndarray:
    """Sample distances along one ray: dense near, sparse far."""
    out = []
    d = NEAR_STEP_M
    while d <= max_range_m + 1e-9:
        out.append(d)
        if d < NEAR_LIMIT_M:
            step = NEAR_STEP_M
        elif d >= FAR_LIMIT_M:
            step = FAR_STEP_M
        else:
            frac = (d - NEAR_LIMIT_M) / (FAR_LIMIT_M - NEAR_LIMIT_M)
            step = NEAR_STEP_M + frac * (FAR_STEP_M - NEAR_STEP_M)
        d += step
    return np.asarray(out)


def view_angles_deg(
    target_height_m, observer_height_m: float, distance_m, radius_m: float = MOON_RADIUS_M
):
    """Elevation angle of terrain points seen from the observer, in degrees."""
    d = np.asarray(distance_m, dtype=float)
    dz = np.asarray(target_height_m, dtype=float) - observer_height_m
    return np.degrees(np.arctan((dz - curvature_drop_m(d, radius_m)) / d))


def terrain_horizon(
    sampler: HeightSampler,
    lat_deg: float,
    lon_deg: float,
    mast_height_m: float,
    ground_height_m: float | None = None,
    max_range_m: float = MAX_RANGE_M,
    radius_m: float = MOON_RADIUS_M,
) -> np.ndarray:
    """Horizon angles (720 values, degrees) for one observation point.

    ``ground_height_m`` defaults to the sampler's height at the site.
    Samples where the sampler returns NaN (outside the map) are ignored.
    A ray with no valid sample at all returns NaN for that direction.
    """
    if mast_height_m < 0:
        raise ValueError("mast_height_m must be zero or greater")

    if ground_height_m is None:
        ground = sampler(np.array([lat_deg]), np.array([lon_deg]))[0]
        if not np.isfinite(ground):
            raise ValueError("no height data at the observation point")
        ground_height_m = float(ground)
    observer = ground_height_m + mast_height_m

    az = azimuths_deg()
    dist = sample_distances_m(max_range_m)
    az_grid, dist_grid = np.meshgrid(az, dist, indexing="ij")
    lat, lon = destination(lat_deg, lon_deg, az_grid, dist_grid, radius_m)

    heights = sampler(lat.ravel(), lon.ravel()).reshape(az_grid.shape)
    angles = view_angles_deg(heights, observer, dist_grid, radius_m)
    angles = np.where(np.isfinite(angles), angles, -np.inf)
    horizon = angles.max(axis=1)
    return np.where(np.isfinite(horizon), horizon, np.nan)
