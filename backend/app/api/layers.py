"""``GET /api/layers/{name}``: a map layer as a raw float32 array.

The body is a headerless little-endian ``Float32Array`` (row-major, north up,
NaN for missing cells); shape, range, validity, source map and grid bounds
travel in ``X-Layer-*`` headers (ADR-0004; frontend-migrate/DESIGN.md, 6.3).
"""

from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import Response

from app.errors import DataUnavailable, InvalidParameter
from app.settings import get_settings
from app.terrain.layers import LAYER_NAMES, REGIONS, find_layer

router = APIRouter(tags=["terrain"])

FORMATS = ("f32",)
DEFAULT_REGION = "mons-mouton"


@router.get("/layers/{name}")
def layer(
    name: str,
    format: str = Query(default="f32"),
    region: str = Query(default=DEFAULT_REGION),
) -> Response:
    """Return the stored layer ``name`` for ``region``: the full resolution
    copy under ``data/raw/layers`` when present, else the bundled
    ``data/layers`` copy."""

    if name not in LAYER_NAMES:
        raise InvalidParameter(
            f"Invalid parameter 'name': must be one of {', '.join(LAYER_NAMES)}, got '{name}'."
        )
    if format not in FORMATS:
        raise InvalidParameter(f"Invalid parameter 'format': must be 'f32', got '{format}'.")
    if region not in REGIONS:
        raise InvalidParameter(
            f"Invalid parameter 'region': must be one of {', '.join(REGIONS)}, got '{region}'."
        )

    try:
        grid = find_layer(get_settings().data_dir, region, name)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        raise DataUnavailable(f"Layer '{name}' for region '{region}' is not available.") from exc

    headers = grid.headers()
    headers["Access-Control-Expose-Headers"] = ", ".join(headers)
    return Response(
        content=grid.values.tobytes(order="C"),
        media_type="application/octet-stream",
        headers=headers,
    )
