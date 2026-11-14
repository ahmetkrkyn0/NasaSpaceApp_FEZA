"""Precompute terrain horizon profiles for catalogue sites.

Reads the PGDA 90 height map over the network (no download), casts 720 rays
per site and writes ``data/horizons/<site_id>_<height>m.json``
(docs/design/ufuk-hesabi.md; docs/design/veri-kaynaklari-ve-on-hesap.md).

Two windows come from the same file:

- near field: full 20 m grid, a square of +-NEAR_HALF_SIZE_M around the site;
- far field: the internal overview 8 times coarser (160 m), +-FAR_HALF_SIZE_M.

The near grid is used wherever it has data, the far grid elsewhere.

Usage:
    python backend/scripts/precompute_horizons.py
    python backend/scripts/precompute_horizons.py --site mons-mouton-im2-target --heights 2 10
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

from app.terrain.dem import (  # noqa: E402
    PGDA90_LDEM_20M_URL,
    PGDA90_PRODUCT,
    LayeredSampler,
    read_window,
)
from app.terrain.horizon import DATA_DIR, HorizonProfile, profile_path  # noqa: E402
from app.terrain.projection import latlon_to_xy  # noqa: E402
from app.terrain.raycast import MAX_RANGE_M, terrain_horizon  # noqa: E402

DEFAULT_SITES = ["mons-mouton-im2-target"]
DEFAULT_HEIGHTS = [2.0, 10.0]

NEAR_HALF_SIZE_M = 15_000.0
FAR_HALF_SIZE_M = MAX_RANGE_M + 2_000.0
FAR_OVERVIEW_LEVEL = 2  # overviews are 2, 4, 8, ... times coarser; level 2 is 8x (160 m)

COVERAGE_LAT_DEG = -80.0  # LDEM_80S_20MPP covers 80 S to the pole


def _net_bytes() -> int | None:
    try:
        import psutil
    except ImportError:
        return None
    return psutil.net_io_counters().bytes_recv


def load_sites(path: Path) -> dict[str, dict]:
    with open(path, encoding="utf-8") as f:
        return {s["id"]: s for s in json.load(f)}


def compute_site(site: dict, heights: list[float], out_dir: Path | None) -> None:
    lat, lon = site["lat_deg"], site["lon_deg"]
    if lat > COVERAGE_LAT_DEG:
        raise SystemExit(f"{site['id']}: latitude {lat} is outside the 80 S height map")

    x, y = latlon_to_xy(lat, lon)
    net0, t0 = _net_bytes(), time.perf_counter()
    near = read_window(PGDA90_LDEM_20M_URL, x, y, NEAR_HALF_SIZE_M)
    far = read_window(PGDA90_LDEM_20M_URL, x, y, FAR_HALF_SIZE_M, overview_level=FAR_OVERVIEW_LEVEL)
    t_read = time.perf_counter() - t0
    net1 = _net_bytes()

    sampler = LayeredSampler([near, far])
    ground = float(sampler(np.array([lat]), np.array([lon]))[0])
    decoded_mb = (near.data.nbytes + far.data.nbytes) / 4 / 1e6  # stored as float32

    print(f"{site['id']}: x={x:.1f} m, y={y:.1f} m, ground height {ground:.1f} m")
    print(
        f"  near grid {near.data.shape} at {near.resolution_m:g} m, "
        f"far grid {far.data.shape} at {far.resolution_m:g} m"
    )
    print(f"  read time {t_read:.1f} s, decoded pixels {decoded_mb:.1f} MB (float32)")
    if net0 is not None and net1 is not None:
        print(f"  network bytes received (whole machine) {(net1 - net0) / 1e6:.1f} MB")

    for h in heights:
        t1 = time.perf_counter()
        values = terrain_horizon(sampler, lat, lon, h, ground_height_m=ground)
        t_ray = time.perf_counter() - t1
        if not np.all(np.isfinite(values)):
            raise SystemExit(f"{site['id']} {h} m: some directions have no height data")

        profile = HorizonProfile(
            lat_deg=lat,
            lon_deg=lon,
            site_id=site["id"],
            mast_height_m=float(h),
            horizon_deg=[round(float(v), 4) for v in values],
            method="terrain",
            max_range_km=MAX_RANGE_M / 1000.0,
            dem={
                "product": PGDA90_PRODUCT,
                "resolution_m": near.resolution_m,
                "url": PGDA90_LDEM_20M_URL,
            },
            validity="DERIVED",
        )
        path = profile_path(site["id"], float(h), out_dir)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(profile.to_dict(), f, indent=1)
            f.write("\n")
        print(
            f"  {h:g} m: ray casting {t_ray:.2f} s, horizon min {values.min():.3f}, "
            f"max {values.max():.3f} deg -> {path}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--site", nargs="+", default=DEFAULT_SITES, help="site ids")
    parser.add_argument("--heights", nargs="+", type=float, default=DEFAULT_HEIGHTS)
    parser.add_argument("--sites-file", type=Path, default=DATA_DIR / "sites.json")
    parser.add_argument("--out-dir", type=Path, default=None, help="default: data/horizons")
    args = parser.parse_args()

    sites = load_sites(args.sites_file)
    for site_id in args.site:
        if site_id not in sites:
            raise SystemExit(f"unknown site id: {site_id}")
        t0 = time.perf_counter()
        compute_site(sites[site_id], args.heights, args.out_dir)
        print(f"  total {time.perf_counter() - t0:.1f} s")


if __name__ == "__main__":
    main()
