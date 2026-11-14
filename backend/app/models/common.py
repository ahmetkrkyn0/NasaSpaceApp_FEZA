"""Shared model types: data validity and the error body."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Validity = Literal["SYNTHETIC", "DERIVED", "MODEL", "MEASURED"]

VALIDITY_RANK = {"SYNTHETIC": 0, "DERIVED": 1, "MODEL": 2, "MEASURED": 3}


def lowest_validity(*values: str) -> str:
    """Return the value with the lowest validity rank."""
    if not values:
        raise ValueError("lowest_validity() needs at least one value")
    lowest = None
    for value in values:
        if value not in VALIDITY_RANK:
            raise ValueError(f"Unknown validity value: {value!r}")
        if lowest is None or VALIDITY_RANK[value] < VALIDITY_RANK[lowest]:
            lowest = value
    return lowest


class ErrorDetail(BaseModel):
    """Machine-readable error code plus a human-readable message."""

    code: str
    message: str


class ErrorBody(BaseModel):
    """Top-level error envelope."""

    error: ErrorDetail
