"""Candidate regions: windows of a region's height maps that pass the slope and
shadow limits (#103; docs/design/saha-puani.md, 2).

``backend/scripts/make_candidates.py`` slides a square window over the 20 m
elevation, slope and permanent shadow grids of a region, measures each window,
keeps the windows whose centre is not permanently shadowed and whose mean
slope is within the limit, and picks the best ones by safe cell fraction with
a minimum separation. The result is ``data/candidates.json``; the ids
(``cand-NN``) resolve as ``site_id`` wherever a location is accepted.

A candidate region is a ranking aid, not a certified landing site: boulders
and craters smaller than the 20 m grid are not in the data.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

from app.terrain.projection import latlon_to_xy, xy_to_latlon

CANDIDATES_FILE = "candidates.json"

SLOPE_LIMIT_DEG = 12.0
"""Largest landing slope: "up to an equivalent slope of 12 degrees"
(SP-2013-605; dogrulama/gorev-araclari.md, No 89). The only limit with a source."""

WINDOW_M = 200.0
STRIDE_M = 100.0
MIN_SEPARATION_KM = 2.0
MAX_CANDIDATES = 12
"""Window size, step, separation and count have no source: "Assumed"."""

NOTE = (
    "Candidate regions are windows of the 20 m height maps ranked by safe cell fraction, then "
    "by lower mean slope; a safe cell has slope at most slope_limit_deg and is not permanently "
    "shadowed, and a window qualifies when its centre is not permanently shadowed and its mean "
    "slope is within the limit. They are not certified landing sites. Boulders and craters "
    "smaller than the 20 m grid are not in the data (not modelled)."
)


@dataclass(frozen=True)
class Grid:
    """The three 20 m grids of a region on one grid (row 0 is the northern edge, y_max)."""

    elevation: np.ndarray
    slope: np.ndarray
    psr: np.ndarray
    x_min: float
    y_max: float
    resolution_m: float

    def cell_xy(self, row: float, col: float) -> tuple[float, float]:
        """Polar stereographic x, y of a cell centre."""

        return (self.x_min + (col + 0.5) * self.resolution_m,
                self.y_max - (row + 0.5) * self.resolution_m)

    def xy_cell(self, x: float, y: float) -> tuple[int, int]:
        return (int(math.floor((self.y_max - y) / self.resolution_m)),
                int(math.floor((x - self.x_min) / self.resolution_m)))


def window_cells(window_m: float, resolution_m: float) -> int:
    n = int(round(window_m / resolution_m))
    if n < 2:
        raise ValueError("window must span at least two cells")
    return n


def window_stats(grid: Grid, window_m: float = WINDOW_M, stride_m: float = STRIDE_M,
                 slope_limit_deg: float = SLOPE_LIMIT_DEG) -> dict[str, np.ndarray]:
    """Metrics of every window, as 2D arrays over the window positions.

    ``row`` and ``col`` are the top-left cell of each window. A window with any
    missing cell gets NaN metrics. A cell is safe when its slope is at most
    the limit and it is not permanently shadowed."""

    w = window_cells(window_m, grid.resolution_m)
    s = max(1, int(round(stride_m / grid.resolution_m)))

    def view(a):
        return sliding_window_view(np.asarray(a, dtype=np.float64), (w, w))[::s, ::s]

    slope, elev, psr = view(grid.slope), view(grid.elevation), view(grid.psr)
    complete = (np.isfinite(slope).all(axis=(2, 3)) & np.isfinite(elev).all(axis=(2, 3))
                & np.isfinite(psr).all(axis=(2, 3)))
    shadow = psr >= 0.5
    safe = (slope <= slope_limit_deg) & ~shadow
    centre = w // 2
    with np.errstate(invalid="ignore"):
        stats = {
            "mean_slope_deg": slope.mean(axis=(2, 3)),
            "max_slope_deg": slope.max(axis=(2, 3)),
            "slope_std_deg": slope.std(axis=(2, 3)),
            "safe_cell_fraction": safe.mean(axis=(2, 3)),
            "psr_fraction": shadow.mean(axis=(2, 3)),
            "elevation_m": elev.mean(axis=(2, 3)),
            "centre_in_psr": shadow[:, :, centre, centre],
        }
    for key in stats:
        if key != "centre_in_psr":
            stats[key] = np.where(complete, stats[key], np.nan)
    rows, cols = np.meshgrid(np.arange(slope.shape[0]) * s, np.arange(slope.shape[1]) * s,
                             indexing="ij")
    stats["row"], stats["col"], stats["complete"] = rows, cols, complete
    stats["cells"] = np.full(rows.shape, w)
    return stats


def psr_points(grid: Grid) -> np.ndarray:
    """x, y of every permanently shadowed cell, shape (n, 2)."""

    rows, cols = np.nonzero(np.asarray(grid.psr) >= 0.5)
    x = grid.x_min + (cols + 0.5) * grid.resolution_m
    y = grid.y_max - (rows + 0.5) * grid.resolution_m
    return np.column_stack([x, y])


def distance_to_psr_km(points: np.ndarray, x: float, y: float) -> float | None:
    """Distance from (x, y) to the nearest shadowed cell centre in the grid;
    ``None`` when the grid has no shadowed cell."""

    if points.size == 0:
        return None
    return float(np.sqrt(((points - (x, y)) ** 2).sum(axis=1)).min()) / 1000.0


def select(stats: dict[str, np.ndarray], grid: Grid, slope_limit_deg: float = SLOPE_LIMIT_DEG,
           min_separation_km: float = MIN_SEPARATION_KM,
           max_count: int = MAX_CANDIDATES) -> list[dict]:
    """Best windows by safe cell fraction (then lower mean slope, then position),
    at least ``min_separation_km`` apart. Excludes incomplete windows, windows
    whose centre cell is shadowed and windows above the slope limit."""

    ok = (stats["complete"] & ~stats["centre_in_psr"]
          & (stats["mean_slope_deg"] <= slope_limit_deg))
    idx = np.argwhere(ok)
    order = sorted(
        (tuple(i) for i in idx),
        key=lambda i: (-stats["safe_cell_fraction"][i], stats["mean_slope_deg"][i], i),
    )
    chosen: list[dict] = []
    sep_m = min_separation_km * 1000.0
    for i in order:
        w = int(stats["cells"][i])
        x, y = grid.cell_xy(stats["row"][i] + (w - 1) / 2, stats["col"][i] + (w - 1) / 2)
        if any(math.hypot(x - c["x"], y - c["y"]) < sep_m for c in chosen):
            continue
        chosen.append({"index": i, "x": x, "y": y})
        if len(chosen) == max_count:
            break
    return chosen


def measure_at(grid: Grid, x: float, y: float, window_m: float = WINDOW_M,
               slope_limit_deg: float = SLOPE_LIMIT_DEG) -> dict | None:
    """Window metrics centred on (x, y), for catalogue sites; ``None`` outside the grid."""

    w = window_cells(window_m, grid.resolution_m)
    r, c = grid.xy_cell(x, y)
    r0, c0 = r - w // 2, c - w // 2
    rows, cols = grid.slope.shape
    if r0 < 0 or c0 < 0 or r0 + w > rows or c0 + w > cols:
        return None
    sub = Grid(
        elevation=grid.elevation[r0:r0 + w, c0:c0 + w],
        slope=grid.slope[r0:r0 + w, c0:c0 + w],
        psr=grid.psr[r0:r0 + w, c0:c0 + w],
        x_min=grid.x_min + c0 * grid.resolution_m,
        y_max=grid.y_max - r0 * grid.resolution_m,
        resolution_m=grid.resolution_m,
    )
    stats = window_stats(sub, window_m, window_m, slope_limit_deg)
    return {k: v[0, 0] for k, v in stats.items()}


def _round(value, digits):
    if value is None:
        return None
    value = float(value)
    return round(value, digits) if math.isfinite(value) else None


def record(kind: str, site_id: str, name: str, x: float, y: float, m: dict,
           psr_xy: np.ndarray, has_terrain_horizon: bool) -> dict:
    """One entry of ``candidates`` (field names of #97, 4.3, plus ``kind``)."""

    lat, lon = xy_to_latlon(x, y)
    return {
        "id": site_id,
        "kind": kind,
        "name": name,
        "lat_deg": round(float(lat), 5),
        "lon_deg": round(float(lon), 5),
        "elevation_m": _round(m["elevation_m"], 1),
        "mean_slope_deg": _round(m["mean_slope_deg"], 2),
        "max_slope_deg": _round(m["max_slope_deg"], 2),
        "slope_std_deg": _round(m["slope_std_deg"], 2),
        "safe_cell_fraction": _round(m["safe_cell_fraction"], 4),
        "psr_fraction": _round(m["psr_fraction"], 4),
        "distance_to_psr_km": _round(distance_to_psr_km(psr_xy, x, y), 3),
        "has_terrain_horizon": has_terrain_horizon,
        "validity": "DERIVED",
    }


def site_xy(site: dict) -> tuple[float, float]:
    x, y = latlon_to_xy(site["lat_deg"], site["lon_deg"])
    return float(x), float(y)


# ---------- the stored file ----------

def load_candidates(data_dir: Path) -> dict:
    """Read ``data/candidates.json``. Raises ``OSError``/``ValueError`` when it
    is missing or malformed."""

    with open(Path(data_dir) / CANDIDATES_FILE, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict) or not isinstance(data.get("candidates"), list):
        raise ValueError("candidates.json has no 'candidates' list")
    return data


def find_candidate(data_dir: Path, site_id: str) -> dict | None:
    """The ``kind: "candidate"`` entry with ``site_id``, or ``None``."""

    try:
        data = load_candidates(data_dir)
    except (OSError, ValueError):
        return None
    for entry in data["candidates"]:
        if entry.get("id") == site_id and entry.get("kind") == "candidate":
            return entry
    return None
