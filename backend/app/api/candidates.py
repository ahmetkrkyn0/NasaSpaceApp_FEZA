"""``GET /api/candidates``: candidate regions of a map region (#97, 4.3).

Serves ``data/candidates.json`` as written by
``backend/scripts/make_candidates.py``: windows of the 20 m height maps that
pass the slope and shadow limits (``kind: "candidate"``) and the catalogue
sites inside the region measured the same way (``kind: "catalogue"``).
Candidate regions are a ranking aid, not certified landing sites.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.errors import DataUnavailable, InvalidParameter
from app.settings import get_settings
from app.terrain.candidates import load_candidates
from app.terrain.layers import REGIONS

router = APIRouter(tags=["terrain"])

DEFAULT_REGION = "mons-mouton"


@router.get("/candidates")
def candidates(region: str = Query(default=DEFAULT_REGION)) -> dict:
    """Return the candidate regions and catalogue sites of ``region``."""

    if region not in REGIONS:
        raise InvalidParameter(
            f"Invalid parameter 'region': must be one of {', '.join(REGIONS)}, got '{region}'."
        )
    try:
        data = load_candidates(get_settings().data_dir)
    except (OSError, ValueError) as exc:
        raise DataUnavailable("Candidate regions are not available.") from exc
    if data.get("region") != region:
        raise DataUnavailable(f"Candidate regions for region '{region}' are not available.")
    return data
