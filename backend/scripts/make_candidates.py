"""Extract candidate regions from a region's 20 m height maps (#103).

Reads the full resolution elevation, slope and permanent shadow layers of the
region from data/raw/layers/ (``python backend/scripts/make_layers.py`` builds
them), slides a window over them, keeps the windows that pass the limits and
writes ``data/candidates.json``. Catalogue sites inside the region get the
same metrics with ``kind: "catalogue"``. Then the 2 m and 10 m terrain
horizons of each candidate are cast like precompute_horizons.py does, from
height windows read once for the whole region.

The metric step reads no network data and is deterministic: the same layers
give the same file.

Usage:
    python backend/scripts/make_candidates.py
    python backend/scripts/make_candidates.py --skip-horizons
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import precompute_horizons as ph  # noqa: E402
from app.settings import get_settings  # noqa: E402
from app.terrain import candidates as cd  # noqa: E402
from app.terrain.dem import PGDA90_LDEM_20M_URL, PGDA90_PRODUCT, LayeredSampler, read_window  # noqa: E402
from app.terrain.horizon import HorizonProfile, profile_path  # noqa: E402
from app.terrain.layers import REGIONS, layers_dir, load_layer  # noqa: E402
from app.terrain.projection import latlon_to_xy  # noqa: E402
from app.terrain.raycast import MAX_RANGE_M, terrain_horizon  # noqa: E402

HEIGHTS = (2.0, 10.0)


def load_grid(data_dir: Path, region_id: str) -> tuple[cd.Grid, dict]:
    raw = layers_dir(data_dir)
    layers = {n: load_layer(raw, region_id, n) for n in ("elevation", "slope", "psr")}
    metas = {n: layer.meta for n, layer in layers.items()}
    keys = {(m.rows, m.cols, m.x_min, m.y_max, m.resolution_m, m.downsample) for m in metas.values()}
    if len(keys) != 1:
        raise SystemExit(f"layers of {region_id} are not on one grid: {keys}")
    m = metas["elevation"]
    if m.downsample != 1:
        raise SystemExit("candidates need the full resolution 20 m layers (make_layers.py)")
    grid = cd.Grid(
        elevation=layers["elevation"].values, slope=layers["slope"].values, psr=layers["psr"].values,
        x_min=m.x_min, y_max=m.y_max, resolution_m=m.resolution_m,
    )
    return grid, metas


def build(data_dir: Path, region_id: str) -> dict:
    grid, metas = load_grid(data_dir, region_id)
    t0 = time.perf_counter()
    stats = cd.window_stats(grid)
    chosen = cd.select(stats, grid)
    psr_xy = cd.psr_points(grid)

    entries = []
    for n, c in enumerate(chosen, start=1):
        cid = f"cand-{n:02d}"
        m = {k: v[c["index"]] for k, v in stats.items()}
        has = all(profile_path(cid, h).is_file() for h in HEIGHTS)
        entries.append(cd.record("candidate", cid, f"Candidate {n}", c["x"], c["y"], m, psr_xy, has))

    with open(Path(data_dir) / "sites.json", encoding="utf-8") as f:
        sites = json.load(f)
    for site in sites:
        x, y = cd.site_xy(site)
        m = cd.measure_at(grid, x, y)
        if m is None:
            continue
        has = all(profile_path(site["id"], h).is_file() for h in HEIGHTS)
        entries.append(cd.record("catalogue", site["id"], site["name"], x, y, m, psr_xy, has))

    windows = int(stats["complete"].sum())
    print(f"{region_id}: {windows} complete windows, {len(chosen)} candidates, "
          f"{len(entries) - len(chosen)} catalogue sites, {time.perf_counter() - t0:.1f} s")
    return {
        "region": region_id,
        "method": {
            "window_m": cd.WINDOW_M,
            "stride_m": cd.STRIDE_M,
            "slope_limit_deg": cd.SLOPE_LIMIT_DEG,
            "slope_limit_source": "SP-2013-605, 'up to an equivalent slope of 12 degrees' "
                                  "(dogrulama/gorev-araclari.md, No 89)",
            "min_separation_km": cd.MIN_SEPARATION_KM,
            "max_candidates": cd.MAX_CANDIDATES,
            "assumed": ["window_m", "stride_m", "min_separation_km", "max_candidates"],
            "source": "PGDA 90 LDEM/LDSM/LPSR 20 m",
            "note": cd.NOTE,
        },
        "candidates": entries,
        "validity": "DERIVED",
    }


def cast_horizons(region_id: str, entries: list[dict]) -> None:
    """2 m and 10 m terrain horizons of the candidates, from one set of windows."""

    region = REGIONS[region_id]
    cx, cy = (float(v) for v in latlon_to_xy(region.lat_deg, region.lon_deg))
    reach = region.half_size_m * 1.5  # candidates lie within the region square
    t0 = time.perf_counter()
    near = read_window(PGDA90_LDEM_20M_URL, cx, cy, region.half_size_m + ph.NEAR_HALF_SIZE_M)
    grids = [
        near,
        read_window(PGDA90_LDEM_20M_URL, cx, cy, ph.FAR_HALF_SIZE_M + reach,
                    overview_level=ph.FAR_OVERVIEW_LEVEL),
        read_window(ph.PGDA90_LDEM_60M_URL, cx, cy, ph.FAR_HALF_SIZE_M + reach,
                    overview_level=ph.FALLBACK_OVERVIEW_LEVEL),
    ]
    mb = sum(g.data.nbytes for g in grids) / 2 / 1e6
    print(f"height windows read in {time.perf_counter() - t0:.1f} s, {mb:.1f} MB decoded (float32)")
    sampler = LayeredSampler(grids)
    for e in entries:
        if e["kind"] != "candidate":
            continue
        lat, lon = e["lat_deg"], e["lon_deg"]
        ground = float(sampler(np.array([lat]), np.array([lon]))[0])
        for h in HEIGHTS:
            values = terrain_horizon(sampler, lat, lon, h, ground_height_m=ground)
            if not np.all(np.isfinite(values)):
                raise SystemExit(f"{e['id']} {h} m: some directions have no height data")
            profile = HorizonProfile(
                lat_deg=lat, lon_deg=lon, site_id=e["id"], mast_height_m=h,
                horizon_deg=[round(float(v), 4) for v in values], method="terrain",
                max_range_km=MAX_RANGE_M / 1000.0,
                dem={"product": PGDA90_PRODUCT, "resolution_m": near.resolution_m,
                     "url": PGDA90_LDEM_20M_URL},
                validity="DERIVED",
            )
            path = profile_path(e["id"], h)
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                json.dump(profile.to_dict(), f, indent=1)
                f.write("\n")
        e["has_terrain_horizon"] = True
        print(f"  {e['id']}: horizons 2 m and 10 m")
    print(f"horizons total {time.perf_counter() - t0:.1f} s")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--region", default="mons-mouton", choices=list(REGIONS))
    parser.add_argument("--skip-horizons", action="store_true")
    parser.add_argument("--out", type=Path, default=None, help="default: data/candidates.json")
    args = parser.parse_args()

    data_dir = get_settings().data_dir
    result = build(data_dir, args.region)
    if not args.skip_horizons:
        cast_horizons(args.region, result["candidates"])
    out = args.out or data_dir / cd.CANDIDATES_FILE
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
