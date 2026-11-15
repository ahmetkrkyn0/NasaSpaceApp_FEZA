"""Site recommendation over candidate regions (#100; #97, 4.4; docs/design/saha-puani.md).

Every site gets six measures: three from the event computation over the
period (``sunlit_fraction``, ``longest_dark_hours``,
``earth_visible_fraction``) and three from its ``data/candidates.json`` record
(``mean_slope_deg``, ``slope_std_deg``, ``distance_to_psr_km``). Each measure
is scaled to 0..1 (1 best), multiplied by the user's weight, summed and
divided by the sum of the weights (saha-puani.md, section 4). A site whose
steepest window slope is above ``max_slope_deg`` gets no score.

The score ranks the sites for the chosen weights; it does not certify a
landing site. Only the 12 degree slope limit has a source; every other scale
is listed in ``assumptions`` as assumed.
"""

from __future__ import annotations

import math
from collections import OrderedDict
from datetime import datetime
from threading import Lock
from typing import Any, Callable

from app.core import events, location, params
from app.errors import DataUnavailable, InvalidParameter
from app.models.common import lowest_validity
from app.settings import get_settings
from app.terrain.candidates import SLOPE_LIMIT_DEG, WINDOW_M, load_candidates
from app.terrain.layers import REGIONS

WEIGHT_KEYS = ("sunlit", "dark", "earth", "slope", "roughness", "psr_distance")
"""Weight names in the order of the components they scale."""

DARK_CAP_HOURS = 336.0
"""Longest darkness that still scores above 0: 14 days (saha-puani.md, 4). Assumed."""

PSR_PREFERENCES = ("near", "far")
NORMALIZED_DIGITS = 3
SCORE_DIGITS = 1

ASSUMPTION_RANKS = "Weights are the user's choice; the score ranks, it does not certify a landing site."
ASSUMPTION_SMALL_FEATURES = "Rocks and craters smaller than the 20 m map cells are not in the data."

EventMetrics = Callable[[str, float, datetime, datetime], dict[str, Any]]
"""``(site_id, mast_height_m, start, end)`` to ``{"metrics": ..., "validity": ...}``."""


# ---------- event metrics cache ----------

_CACHE_SIZE = 256
_cache: OrderedDict[tuple, dict[str, Any]] = OrderedDict()
_cache_lock = Lock()


def clear_cache() -> None:
    """Forget every cached event computation."""

    with _cache_lock:
        _cache.clear()


def site_event_metrics(site_id: str, mast_height_m: float, start: datetime, end: datetime) -> dict[str, Any]:
    """Event metrics of ``site_id`` over ``[start, end]``, cached in the process.

    The key holds the data directory, the site, the mast height and the period,
    so changing only the weights or limits reuses the result (#100, item 6).
    """

    key = (str(get_settings().data_dir), site_id, float(mast_height_m), start, end)
    with _cache_lock:
        if key in _cache:
            _cache.move_to_end(key)
            return _cache[key]

    observer = events.observer_for(location.resolve(site_id), mast_height_m)
    result = events.compute_events(observer, start, end, "center")
    value = {"metrics": dict(result["metrics"]), "validity": result["validity"]}

    with _cache_lock:
        _cache[key] = value
        _cache.move_to_end(key)
        while len(_cache) > _CACHE_SIZE:
            _cache.popitem(last=False)
    return value


# ---------- checks ----------

def check_weights(weights: dict[str, float]) -> dict[str, float]:
    """Every weight between 0 and 1, and at least one above 0."""

    checked = {}
    for key in WEIGHT_KEYS:
        value = weights.get(key)
        if value is None or not math.isfinite(value) or not 0.0 <= value <= 1.0:
            raise InvalidParameter(f"Invalid parameter 'weights.{key}': must be between 0 and 1, got {value}.")
        checked[key] = float(value)
    if sum(checked.values()) <= 0.0:
        raise InvalidParameter("Invalid parameter 'weights': at least one weight must be above 0.")
    return checked


def check_max_slope(value: float | None) -> float:
    """The elimination slope; ``None`` means the 12 degree limit."""

    if value is None:
        return SLOPE_LIMIT_DEG
    if not math.isfinite(value) or not 0.0 < value <= 90.0:
        raise InvalidParameter(f"Invalid parameter 'limits.max_slope_deg': must be above 0 and at most 90, got {value}.")
    return float(value)


def check_psr_preference(value: str | None) -> str:
    if value is None:
        return "far"
    if value not in PSR_PREFERENCES:
        raise InvalidParameter(
            f"Invalid parameter 'psr_preference': must be one of {', '.join(PSR_PREFERENCES)}, got '{value}'."
        )
    return value


def check_region(region: str) -> str:
    if region not in REGIONS:
        raise InvalidParameter(f"Invalid parameter 'region': must be one of {', '.join(REGIONS)}, got '{region}'.")
    return region


# ---------- scaling and scoring ----------

def _clamp01(value: float) -> float:
    return min(1.0, max(0.0, value))


def scale_down(value: float | None, cap: float) -> float | None:
    """Smaller is better: ``1 - value / cap``, kept in 0..1."""

    if value is None or cap <= 0.0:
        return None
    return _clamp01(1.0 - value / cap)


def scale_up(value: float | None, cap: float | None = None) -> float | None:
    """Larger is better: ``value`` itself, or ``value / cap``, kept in 0..1."""

    if value is None:
        return None
    if cap is None:
        return _clamp01(value)
    if cap <= 0.0:
        return None
    return _clamp01(value / cap)


def _region_max(records: list[dict[str, Any]], field: str) -> float:
    values = [float(r[field]) for r in records if r.get(field) is not None]
    return max(values, default=0.0)


def scales(records: list[dict[str, Any]], max_slope_deg: float) -> dict[str, float]:
    """Upper values the measures are scaled against.

    Roughness and distance to permanent shadow use the largest value among all
    records of the region (catalogue sites included, whether or not they are
    ranked), so the scale does not depend on ``include_catalogue_sites``.
    """

    return {
        "dark_hours": DARK_CAP_HOURS,
        "slope_deg": max_slope_deg,
        "slope_std_deg": _region_max(records, "slope_std_deg"),
        "psr_km": _region_max(records, "distance_to_psr_km"),
    }


def _component(metric: str, value: float | None, unit: str, normalized: float | None,
               weight: float, validity: str) -> dict[str, Any]:
    return {
        "metric": metric,
        "value": value,
        "unit": unit,
        "normalized": None if normalized is None else round(normalized, NORMALIZED_DIGITS),
        "weight": weight,
        "validity": validity,
    }


def components(site: dict[str, Any], weights: dict[str, float], caps: dict[str, float],
               psr_preference: str) -> list[dict[str, Any]]:
    """The six score components of ``site`` (event metrics plus its terrain record)."""

    ev = site["events"]["metrics"]
    ev_validity = site["events"]["validity"]
    terrain_validity = site["validity"]
    psr = site.get("distance_to_psr_km")
    if psr is None:
        # ADR-0003: null means the region has no permanent shadow at all.
        psr_normalized = 1.0 if psr_preference == "far" else 0.0
    elif psr_preference == "far":
        psr_normalized = scale_up(psr, caps["psr_km"])
    else:
        psr_normalized = scale_down(psr, caps["psr_km"])
    return [
        _component("sunlit_fraction", params.rounded(ev["sunlit_fraction"], 4), "1",
                   scale_up(ev["sunlit_fraction"]), weights["sunlit"], ev_validity),
        _component("longest_dark_hours", params.rounded(ev["longest_dark_hours"], 2), "h",
                   scale_down(ev["longest_dark_hours"], caps["dark_hours"]), weights["dark"], ev_validity),
        _component("earth_visible_fraction", params.rounded(ev["earth_visible_fraction"], 4), "1",
                   scale_up(ev["earth_visible_fraction"]), weights["earth"], ev_validity),
        _component("mean_slope_deg", params.rounded(site.get("mean_slope_deg"), 2), "deg",
                   scale_down(site.get("mean_slope_deg"), caps["slope_deg"]), weights["slope"], terrain_validity),
        _component("slope_std_deg", params.rounded(site.get("slope_std_deg"), 2), "deg",
                   scale_down(site.get("slope_std_deg"), caps["slope_std_deg"]), weights["roughness"],
                   terrain_validity),
        _component("distance_to_psr_km", params.rounded(psr, 3), "km", psr_normalized,
                   weights["psr_distance"], terrain_validity),
    ]


def raw_score(parts: list[dict[str, Any]]) -> float:
    """Weighted mean of the normalized components, 0..100, from the rounded values.

    A component without a value counts as 0, so a missing measure never raises
    a site's score.
    """

    total_weight = sum(p["weight"] for p in parts)
    weighted = sum(p["weight"] * (p["normalized"] or 0.0) for p in parts)
    return 100.0 * weighted / total_weight


def eliminated_by(site: dict[str, Any], max_slope_deg: float) -> list[str]:
    """Limits ``site`` breaks: the steepest slope in its window above ``max_slope_deg``."""

    steepest = site.get("max_slope_deg")
    if steepest is None or float(steepest) > max_slope_deg:
        return ["max_slope_deg"]
    return []


def rank(sites: list[dict[str, Any]], weights: dict[str, float], max_slope_deg: float,
         psr_preference: str, caps: dict[str, float]) -> list[dict[str, Any]]:
    """Ranked sites: scored ones by score (highest first), then eliminated ones.

    Each ``site`` is a candidate record with an ``events`` entry
    (``{"metrics": ..., "validity": ...}``). Ties keep the record order.
    """

    scored: list[tuple[float, int, dict[str, Any]]] = []
    dropped: list[dict[str, Any]] = []
    for index, site in enumerate(sites):
        parts = components(site, weights, caps, psr_preference)
        broken = eliminated_by(site, max_slope_deg)
        entry = {
            "site_id": site["id"],
            "name": site["name"],
            "lat_deg": site["lat_deg"],
            "lon_deg": site["lon_deg"],
            "score": None,
            "eliminated": bool(broken),
            "eliminated_by": broken,
            "components": parts,
            "validity": lowest_validity(*(p["validity"] for p in parts)),
        }
        if broken:
            dropped.append(entry)
        else:
            raw = raw_score(parts)
            entry["score"] = round(raw, SCORE_DIGITS)
            scored.append((raw, index, entry))
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [entry for _, _, entry in scored] + dropped


def assumptions(max_slope_deg: float, caps: dict[str, float], psr_preference: str,
                ranked: list[dict[str, Any]]) -> list[str]:
    """Notes shown with every answer; every scale without a source is named "Assumed"."""

    notes = [ASSUMPTION_RANKS, ASSUMPTION_SMALL_FEATURES]
    if max_slope_deg == SLOPE_LIMIT_DEG:
        notes.append(
            f"A site is eliminated when the steepest slope in its {WINDOW_M:g} m window is above "
            f"{SLOPE_LIMIT_DEG:g} degrees, the Apollo lunar module's largest landing slope "
            "(SP-2013-605; dogrulama/gorev-araclari.md, No 89). Other vehicles may differ."
        )
    else:
        notes.append(
            f"Assumed: the {max_slope_deg:g} degree slope limit is the user's choice; only the "
            f"{SLOPE_LIMIT_DEG:g} degree limit has a source (SP-2013-605)."
        )
    notes += [
        "Thresholds other than the 12 degree slope limit are assumed.",
        f"Assumed: longest darkness is scaled against {caps['dark_hours']:g} h (14 days); longer darkness scores 0.",
        f"Assumed: mean slope is scaled against the slope limit, {caps['slope_deg']:g} degrees.",
        f"Assumed: roughness (slope spread in the window) is scaled against the largest value in the region, "
        f"{caps['slope_std_deg']:g} degrees.",
        f"Assumed: distance to permanent shadow is scaled against the largest value in the region, "
        f"{caps['psr_km']:g} km; '{psr_preference}' scores "
        + ("farther sites higher (power)." if psr_preference == "far" else "nearer sites higher (science, ice)."),
        "Sunlit and Earth-visible fractions are used as they are (0 to 1); Earth counts as visible "
        "when the centre of its disk is above the horizon.",
    ]
    if any(
        p["validity"] == "SYNTHETIC" and p["metric"] == "sunlit_fraction" for site in ranked for p in site["components"]
    ):
        notes.append("Sites without a terrain horizon at this mast height use a flat horizon (SYNTHETIC).")
    return notes


# ---------- request ----------

def recommend(request: dict[str, Any], event_metrics: EventMetrics = site_event_metrics) -> dict[str, Any]:
    """``RecommendResponse`` fields for a ``RecommendRequest`` body."""

    region = check_region(request.get("region") or "mons-mouton")
    weights = check_weights(request.get("weights") or {})
    max_slope = check_max_slope((request.get("limits") or {}).get("max_slope_deg"))
    psr_preference = check_psr_preference(request.get("psr_preference"))
    mast = params.resolve_mast_height(params.check_mast_height(request.get("mast_height_m")))
    start = params.parse_time("start_utc", request.get("start_utc"))
    end = params.parse_time("end_utc", request.get("end_utc"))
    params.check_interval(start, end)

    try:
        data = load_candidates(get_settings().data_dir)
    except (OSError, ValueError) as exc:
        raise DataUnavailable("Candidate regions are not available.") from exc
    if data.get("region") != region:
        raise DataUnavailable(f"Candidate regions for region '{region}' are not available.")

    records = [r for r in data["candidates"] if r.get("kind") in ("candidate", "catalogue")]
    include_catalogue = request.get("include_catalogue_sites", True)
    chosen = [r for r in records if r.get("kind") == "candidate" or include_catalogue]

    sites = [{**r, "events": event_metrics(r["id"], mast, start, end)} for r in chosen]
    caps = scales(records, max_slope)
    ranked = rank(sites, weights, max_slope, psr_preference, caps)
    validity = lowest_validity(*(s["validity"] for s in ranked)) if ranked else data.get("validity", "SYNTHETIC")
    return {
        "ranked": ranked,
        "weights": weights,
        "limits": {"max_slope_deg": max_slope},
        "assumptions": assumptions(max_slope, caps, psr_preference, ranked),
        "validity": validity,
    }
