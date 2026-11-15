"""``GET /api/health``: server status and the computable date range."""

from __future__ import annotations

from fastapi import APIRouter

from app.core import ephemeris
from app.errors import DataUnavailable
from app.settings import get_settings
from app.terrain.layers import layers_available

router = APIRouter(tags=["health"])


def _dem_available() -> bool:
    """True when the DEM folder exists and holds at least one file."""

    dem_dir = get_settings().dem_dir
    return dem_dir.is_dir() and any(path.is_file() for path in dem_dir.rglob("*"))


@router.get("/health")
def health() -> dict:
    """Report whether kernels, DEMs and map layers are present; always answers 200."""

    try:
        start, end = ephemeris.ephemeris_range()
    except DataUnavailable:
        kernels_loaded = False
        ephemeris_range = None
    else:
        kernels_loaded = True
        ephemeris_range = {
            "start_utc": ephemeris.format_utc(start),
            "end_utc": ephemeris.format_utc(end),
        }

    return {
        "ok": True,
        "kernels_loaded": kernels_loaded,
        "dem_available": _dem_available(),
        "layers_available": layers_available(get_settings().data_dir),
        "ephemeris_range": ephemeris_range,
    }
