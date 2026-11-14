"""``GET /api/panel-profiles``: panel profiles from ``data/panel_profiles.json``."""

from __future__ import annotations

from fastapi import APIRouter

from app.core import catalog

router = APIRouter(tags=["catalog"])


@router.get("/panel-profiles")
def panel_profiles() -> list[dict]:
    """Return the panel profile records as stored."""

    return catalog.load_panel_profiles()
