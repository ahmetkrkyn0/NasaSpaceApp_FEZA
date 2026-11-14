"""Horizon profiles: flat (sphere) horizon, stored terrain profiles, lookup.

Shared interface with line A (docs/PLAN.md, F1-B):

- ``get_horizon_profile(lat_deg, lon_deg, mast_height_m, site_id=None)``
  returns a ``HorizonProfile`` and applies the mast height rule (ADR-0003).
- ``horizon_at(profile, azimuth_deg)`` reads the horizon angle linearly
  between the two neighbouring directions; 359.5 and 0 are neighbours.
"""

from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Mapping

from .projection import MOON_RADIUS_M, normalize_lon
from .raycast import AZIMUTH_COUNT, AZIMUTH_STEP_DEG

DATA_DIR = Path(__file__).resolve().parents[3] / "data"
HORIZONS_DIR = DATA_DIR / "horizons"

TERRAIN_MAST_HEIGHTS_M = (2.0, 10.0)
"""Heights with precomputed terrain profiles (ADR-0003, mast height rule)."""


@dataclass
class HorizonProfile:
    """``HorizonProfile`` structure of ADR-0003."""

    lat_deg: float
    lon_deg: float
    site_id: str | None
    mast_height_m: float
    horizon_deg: list[float]
    method: str
    max_range_km: float | None = None
    dem: dict[str, Any] | None = None
    validity: str = "SYNTHETIC"
    azimuth_step_deg: float = field(default=AZIMUTH_STEP_DEG)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        order = [
            "site_id", "lat_deg", "lon_deg", "mast_height_m", "azimuth_step_deg",
            "horizon_deg", "method", "max_range_km", "dem", "validity",
        ]
        return {k: d[k] for k in order}

    @classmethod
    def from_dict(cls, d: Mapping[str, Any]) -> "HorizonProfile":
        return cls(
            lat_deg=float(d["lat_deg"]),
            lon_deg=float(d["lon_deg"]),
            site_id=d.get("site_id"),
            mast_height_m=float(d["mast_height_m"]),
            horizon_deg=[float(v) for v in d["horizon_deg"]],
            method=d["method"],
            max_range_km=d.get("max_range_km"),
            dem=d.get("dem"),
            validity=d["validity"],
            azimuth_step_deg=float(d.get("azimuth_step_deg", AZIMUTH_STEP_DEG)),
        )


def horizon_dip_deg(mast_height_m: float, radius_m: float = MOON_RADIUS_M) -> float:
    """How far the flat horizon lies below the local horizontal, in degrees.

    ``arccos(R / (R + h))`` (dogrulama/ufuk-ve-isik-isi.md, No A-7).
    """
    if mast_height_m < 0:
        raise ValueError("mast_height_m must be zero or greater")
    return math.degrees(math.acos(radius_m / (radius_m + mast_height_m)))


def horizon_distance_km(mast_height_m: float, radius_m: float = MOON_RADIUS_M) -> float:
    """Distance to the flat horizon, ``sqrt(2Rh + h^2)`` (No A-6)."""
    if mast_height_m < 0:
        raise ValueError("mast_height_m must be zero or greater")
    h = mast_height_m
    return math.sqrt(2.0 * radius_m * h + h * h) / 1000.0


def sphere_profile(
    lat_deg: float, lon_deg: float, mast_height_m: float, site_id: str | None = None
) -> HorizonProfile:
    """Flat horizon: 720 equal values, the negative of the dip angle."""
    value = -horizon_dip_deg(mast_height_m)
    return HorizonProfile(
        lat_deg=float(lat_deg),
        lon_deg=float(normalize_lon(lon_deg)),
        site_id=site_id,
        mast_height_m=float(mast_height_m),
        horizon_deg=[value] * AZIMUTH_COUNT,
        method="sphere",
        max_range_km=None,
        dem=None,
        validity="SYNTHETIC",
    )


def profile_path(site_id: str, mast_height_m: float, horizons_dir: Path | None = None) -> Path:
    """``data/horizons/<site_id>_<height>m.json`` (ADR-0003)."""
    base = HORIZONS_DIR if horizons_dir is None else Path(horizons_dir)
    return base / f"{site_id}_{mast_height_m:g}m.json"


def load_profile(path: Path) -> HorizonProfile:
    with open(path, encoding="utf-8") as f:
        profile = HorizonProfile.from_dict(json.load(f))
    if len(profile.horizon_deg) != AZIMUTH_COUNT:
        raise ValueError(f"{path}: expected {AZIMUTH_COUNT} values")
    return profile


def get_horizon_profile(
    lat_deg: float,
    lon_deg: float,
    mast_height_m: float,
    site_id: str | None = None,
    horizons_dir: Path | None = None,
) -> HorizonProfile:
    """Horizon provider with the mast height rule of ADR-0003.

    A stored terrain profile is used only for a catalogue site at 2 or 10 m
    when the file exists. Every other case (other heights including zero,
    custom coordinates, sites without a file) gets the flat horizon with the
    ``SYNTHETIC`` label. A negative height raises ``ValueError``; the API
    layer turns that into HTTP 422.
    """
    if mast_height_m is None or not math.isfinite(mast_height_m) or mast_height_m < 0:
        raise ValueError("mast_height_m must be zero or greater")

    if site_id is not None and float(mast_height_m) in TERRAIN_MAST_HEIGHTS_M:
        path = profile_path(site_id, float(mast_height_m), horizons_dir)
        if path.is_file():
            return load_profile(path)

    return sphere_profile(lat_deg, lon_deg, mast_height_m, site_id)


def horizon_at(profile: HorizonProfile | Mapping[str, Any], azimuth_deg: float) -> float:
    """Horizon angle at any azimuth, linear between neighbouring samples."""
    if isinstance(profile, Mapping):
        values = profile["horizon_deg"]
        step = float(profile.get("azimuth_step_deg", AZIMUTH_STEP_DEG))
    else:
        values = profile.horizon_deg
        step = profile.azimuth_step_deg
    n = len(values)
    pos = (float(azimuth_deg) % 360.0) / step
    i0 = int(math.floor(pos)) % n
    i1 = (i0 + 1) % n
    frac = pos - math.floor(pos)
    return float(values[i0]) * (1.0 - frac) + float(values[i1]) * frac
