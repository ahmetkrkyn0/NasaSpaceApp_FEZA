"""``GET /api/validation``: the stored validation report.

Returns ``data/validation_report.json`` as it is (ADR-0004, ``/api/validation``).
The report is written by ``backend/scripts/run_validation.py``; the server does
not rerun the tests on request.
"""

from __future__ import annotations

import json

from fastapi import APIRouter

from app.errors import DataUnavailable
from app.settings import get_settings

router = APIRouter(tags=["validation"])

REPORT_FILE = "validation_report.json"


@router.get("/validation")
def validation() -> dict:
    """Return the validation report; 503 ``data_unavailable`` when it is missing or unreadable."""

    path = get_settings().data_dir / REPORT_FILE
    try:
        with open(path, encoding="utf-8") as f:
            report = json.load(f)
    except (OSError, ValueError) as exc:
        raise DataUnavailable("The validation report is not available.") from exc
    if not isinstance(report, dict) or not isinstance(report.get("rows"), list):
        raise DataUnavailable("The validation report is not available.")
    return report
