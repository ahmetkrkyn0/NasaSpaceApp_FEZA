"""Relay label: whether a site can talk to Earth directly (docs/design/role-etiketi.md).

The label only describes the line of sight to Earth over the queried range.
Relay satellites themselves are not modelled.
"""

from __future__ import annotations

from typing import Literal

RELAY_MIN_HOURS = 708.7
"""One synodic month. A shorter range without Earth does not show the site never sees Earth."""

RelayStatus = Literal["not_required", "intermittent", "required", "unknown"]


def relay_status(earth_visible_fraction: float | None, range_hours: float) -> RelayStatus:
    """Label from the share of the range with Earth visible.

    ``required`` needs a hidden Earth over at least ``RELAY_MIN_HOURS``; a
    shorter range without Earth gives ``unknown``.
    """

    if earth_visible_fraction is None:
        return "unknown"
    if earth_visible_fraction <= 0.0:
        return "required" if range_hours >= RELAY_MIN_HOURS else "unknown"
    if earth_visible_fraction >= 1.0:
        return "not_required"
    return "intermittent"


def relay_required(status: str) -> bool:
    """``True`` only when the label is ``required``."""

    return status == "required"
