"""Solar panel power over a time range (docs/design/guc-degerlendirmesi.md).

For every sample: P = efficiency x area x 1361 / r_au^2 x incidence x visible fraction,
where incidence depends on how the panel stands (solar-panel-model, section 4).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import numpy as np

from app.core import catalog, ephemeris
from app.core.events import Observer, grid
from app.errors import InvalidParameter
from app.models.common import lowest_validity
from app.terrain.horizon import horizon_at

SOLAR_CONSTANT_W_M2 = 1361.0
"""Total solar irradiance at 1 AU (Kopp and Lean, 2011)."""

DEFAULT_STEP_MINUTES = 60
PANEL_TYPES = ("horizontal", "vertical_fixed", "vertical_tracking", "two_axis")
AZIMUTH_SCAN_STEP_DEG = 0.5
"""Resolution of the best-direction search for a ``vertical_fixed`` panel."""


def find_panel(panel_profile_id: str | None) -> dict[str, Any]:
    """Panel profile record from ``data/panel_profiles.json``; unknown id gives 422."""

    if panel_profile_id is None:
        raise InvalidParameter("Invalid parameter 'panel_profile_id': required.")
    for panel in catalog.load_panel_profiles():
        if panel.get("id") == panel_profile_id:
            return panel
    raise InvalidParameter(f"Invalid parameter 'panel_profile_id': no panel profile with id '{panel_profile_id}'.")


def disk_fraction(
    elevation_deg: np.ndarray,
    horizon_deg: np.ndarray,
    radius_deg: np.ndarray,
    model: str = "area",
) -> np.ndarray:
    """Visible part of the Sun's disk above the horizon.

    ``area`` (product): circular-segment area fraction, as in ``visibility.visible_fraction``.
    ``vertical``: the linear vertical fraction used by the T3 reference table.
    """

    if model == "vertical":
        return np.clip((elevation_deg - horizon_deg) / (2.0 * radius_deg) + 0.5, 0.0, 1.0)
    x = np.clip((elevation_deg - horizon_deg) / radius_deg, -1.0, 1.0)
    return np.clip((np.pi - np.arccos(x) + x * np.sqrt(1.0 - x * x)) / np.pi, 0.0, 1.0)


def incidence_cos(
    panel_type: str, azimuth_deg: np.ndarray, elevation_deg: np.ndarray, fixed_azimuth_deg: float | None = None
) -> np.ndarray:
    """``max(0, s . n)`` for each panel type; ``fixed_azimuth_deg`` is the direction a fixed panel faces."""

    el = np.radians(elevation_deg)
    if panel_type == "two_axis":
        return np.ones_like(el)
    if panel_type == "vertical_tracking":
        return np.clip(np.cos(el), 0.0, None)
    if panel_type == "horizontal":
        return np.clip(np.sin(el), 0.0, None)
    if panel_type == "vertical_fixed":
        az = np.radians(azimuth_deg - (fixed_azimuth_deg or 0.0))
        return np.clip(np.cos(el) * np.cos(az), 0.0, None)
    raise InvalidParameter(f"Unknown panel type '{panel_type}'.")


def best_fixed_azimuth(azimuth_deg: np.ndarray, elevation_deg: np.ndarray, weight: np.ndarray) -> float:
    """Direction a vertical fixed panel should face to collect the most energy over the samples."""

    candidates = np.arange(0.0, 360.0, AZIMUTH_SCAN_STEP_DEG)
    el = np.radians(elevation_deg)[None, :]
    delta = np.radians(azimuth_deg[None, :] - candidates[:, None])
    collected = (np.clip(np.cos(el) * np.cos(delta), 0.0, None) * weight[None, :]).sum(axis=1)
    return float(candidates[int(np.argmax(collected))])


def _longest_run(mask: np.ndarray) -> int:
    best = current = 0
    for value in mask:
        current = current + 1 if value else 0
        best = max(best, current)
    return best


def compute_power(
    observer: Observer,
    start: datetime,
    end: datetime,
    panel: dict[str, Any],
    fixed_azimuth_deg: float | None = None,
    step_minutes: float = DEFAULT_STEP_MINUTES,
    disk_model: str = "area",
    sun_radius_deg: float | None = None,
) -> dict[str, Any]:
    """``PowerSeries`` fields for ``panel`` (a ``PanelProfile`` record).

    ``fixed_azimuth_deg`` is used only for ``vertical_fixed``; when neither the
    request nor the profile gives one, the best direction over the range is
    searched and reported. ``sun_radius_deg`` overrides the computed apparent
    radius (the T3 reference uses a fixed 0.267 degrees).
    """

    panel_type = panel.get("type")
    if panel_type not in PANEL_TYPES:
        raise InvalidParameter(f"Panel profile '{panel.get('id')}' has unknown type '{panel_type}'.")

    times = grid(start, end, step_minutes)
    positions = ephemeris.body_positions(observer.lat_deg, observer.lon_deg, observer.height_m, times, "SUN")
    az = np.array([p.azimuth_true_deg for p in positions])
    el = np.array([p.elevation_deg for p in positions])
    radius = np.array([p.radius_deg for p in positions]) if sun_radius_deg is None else np.full(len(positions), sun_radius_deg)
    range_au = np.array([p.range_km for p in positions]) / ephemeris.AU_KM
    horizon = np.array([horizon_at(observer.profile, a) for a in az])

    irradiance = SOLAR_CONSTANT_W_M2 / range_au**2
    fraction = disk_fraction(el, horizon, radius, disk_model)

    used_azimuth = None
    if panel_type == "vertical_fixed":
        if fixed_azimuth_deg is None:
            fixed_azimuth_deg = panel.get("fixed_azimuth_deg")
        if fixed_azimuth_deg is None:
            fixed_azimuth_deg = best_fixed_azimuth(az, el, irradiance * fraction)
        used_azimuth = float(fixed_azimuth_deg) % 360.0

    incidence = incidence_cos(panel_type, az, el, used_azimuth)
    area = float(panel.get("area_m2", 1.0))
    efficiency = float(panel.get("efficiency", 1.0))
    power = efficiency * area * irradiance * incidence * fraction

    step_hours = step_minutes / 60.0
    total_hours = (end - start).total_seconds() / 3600.0
    mean_power = float(power.mean())
    samples = [
        {
            "utc": moment,
            "incidence_cos": float(incidence[i]),
            "sun_visible_fraction": float(fraction[i]),
            "irradiance_w_m2": float(irradiance[i]),
            "power_w": float(power[i]),
        }
        for i, moment in enumerate(times)
    ]
    return {
        "panel_profile_id": panel.get("id"),
        "fixed_azimuth_deg": used_azimuth,
        "samples": samples,
        "summary": {
            "mean_power_w": mean_power,
            "energy_kwh": mean_power * total_hours / 1000.0,
            "sunlit_fraction": float((fraction > 0.0).mean()),
            "longest_dark_hours": _longest_run(fraction == 0.0) * step_hours,
        },
        "validity": lowest_validity(panel.get("validity", "SYNTHETIC"), observer.profile.validity),
    }
