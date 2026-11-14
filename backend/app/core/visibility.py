"""Visibility of a celestial disk above a horizon line."""

from __future__ import annotations

import math


def visible_fraction(elevation_deg: float, horizon_deg: float, radius_deg: float) -> float:
    """Return the fraction of the disk area that lies above the horizon line.

    The disk is modelled as a circle of angular radius ``radius_deg`` centred at
    ``elevation_deg``; the horizon is the straight line at ``horizon_deg``. The
    visible part is a circular segment whose area fraction depends only on the
    normalised offset ``x = (elevation_deg - horizon_deg) / radius_deg``.
    """

    if radius_deg <= 0.0:
        return 1.0 if elevation_deg >= horizon_deg else 0.0

    x = (elevation_deg - horizon_deg) / radius_deg
    if x <= -1.0:
        return 0.0
    if x >= 1.0:
        return 1.0

    fraction = (math.pi - math.acos(x) + x * math.sqrt(1.0 - x * x)) / math.pi
    return min(1.0, max(0.0, fraction))
