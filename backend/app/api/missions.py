"""``GET /api/reference-missions``: past landings from ``data/reference_missions.json``."""

from __future__ import annotations

from fastapi import APIRouter

from app.core import catalog

router = APIRouter(tags=["catalog"])


@router.get("/reference-missions")
def reference_missions() -> list[dict]:
    """Return the reference mission records as stored."""

    return catalog.load_reference_missions()
