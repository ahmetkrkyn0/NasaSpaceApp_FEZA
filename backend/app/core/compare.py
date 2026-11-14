"""Side-by-side comparison of up to four scenarios (docs/design/karsilastirma-ve-aciklama.md)."""

from __future__ import annotations

from typing import Any

from app.core import events, location, params, power
from app.core.now import now_status
from app.errors import InvalidParameter, TooManyScenarios
from app.models.common import lowest_validity

MAX_SCENARIOS = 4
MIN_SCENARIOS = 2

METRICS: tuple[tuple[str, str, str], ...] = (
    ("sunlit_fraction", "fraction", "max"),
    ("longest_dark_hours", "hours", "min"),
    ("max_sun_elevation_deg", "deg", "max"),
    ("earth_visible_fraction", "fraction", "max"),
    ("longest_earth_hidden_hours", "hours", "min"),
    ("mean_power_w", "W", "max"),
)
"""Metric name, unit and which direction is better."""


def _evaluate(scenario: dict[str, Any]) -> dict[str, Any]:
    """Events metrics, mean panel power and the state at ``start_utc`` for one scenario."""

    sid = scenario["scenario_id"]
    try:
        place = location.resolve(scenario.get("site_id"), scenario.get("lat_deg"), scenario.get("lon_deg"))
        criterion = params.check_criterion(scenario.get("earth_criterion"))
        start = params.parse_time("start_utc", scenario.get("start_utc"))
        end = params.parse_time("end_utc", scenario.get("end_utc"))
        params.check_interval(start, end)
        panel = power.find_panel(scenario.get("panel_profile_id"))
        mast = params.resolve_mast_height(params.check_mast_height(scenario.get("mast_height_m")), panel)
    except InvalidParameter as exc:
        raise InvalidParameter(f"Scenario '{sid}': {exc.message}") from None

    observer = events.observer_for(place, mast)
    result = events.compute_events(observer, start, end, criterion)
    series = power.compute_power(observer, start, end, panel, scenario.get("fixed_azimuth_deg"))
    now = now_status(observer, start, criterion)
    now["mast_height_m"] = mast

    metrics = dict(result["metrics"])
    metrics["mean_power_w"] = series["summary"]["mean_power_w"]
    echoed = dict(scenario)
    echoed["mast_height_m"] = mast
    echoed["earth_criterion"] = criterion
    return {
        "scenario": echoed,
        "metrics": metrics,
        "now": now,
        "validity": lowest_validity(result["validity"], series["validity"]),
    }


def _best(values: dict[str, float | None], direction: str) -> str | None:
    known = {sid: v for sid, v in values.items() if v is not None}
    if not known:
        return None
    pick = max if direction == "max" else min
    target = pick(known.values())
    return next(sid for sid, v in known.items() if v == target)


def compare(scenarios: list[dict[str, Any]]) -> dict[str, Any]:
    """``CompareResponse`` fields. The comparison's label is the lowest ``validity`` among scenarios."""

    if len(scenarios) > MAX_SCENARIOS:
        raise TooManyScenarios(f"At most {MAX_SCENARIOS} scenarios can be compared, got {len(scenarios)}.")
    if len(scenarios) < MIN_SCENARIOS:
        raise InvalidParameter(f"Invalid parameter 'scenarios': give at least {MIN_SCENARIOS} scenarios.")
    ids = [s["scenario_id"] for s in scenarios]
    if len(set(ids)) != len(ids):
        raise InvalidParameter("Invalid parameter 'scenarios': scenario_id values must be unique.")

    results = [_evaluate(s) for s in scenarios]
    deltas = []
    for name, unit, direction in METRICS:
        values = {r["scenario"]["scenario_id"]: r["metrics"][name] for r in results}
        deltas.append({"metric": name, "values": values, "unit": unit, "best_scenario_id": _best(values, direction)})
    return {"scenarios": results, "deltas": deltas}
