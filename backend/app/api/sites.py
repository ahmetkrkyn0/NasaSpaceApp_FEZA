"""``GET /api/sites``: the ready-made site list from ``data/sites.json``."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.core import catalog

router = APIRouter(tags=["catalog"])


@router.get("/sites")
def sites(category: str | None = Query(default=None)) -> list[dict]:
    """Return the site records as stored, optionally filtered by category."""

    records = catalog.load_sites()
    if category is not None:
        records = [record for record in records if record.get("category") == category]
    return records
