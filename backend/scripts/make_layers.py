"""Read the map layer windows for a region and store them under data/raw/layers/.

Each layer is read over HTTP range requests from its PGDA 90 map (no
download of the whole file) and written as ``<region>_<name>.f32`` and
``<region>_<name>.json`` (see ``app.terrain.layers``). ``/api/layers/{name}``
serves these files. All layers of a region must land on the same grid.

``--bundle`` does not touch the network: it reads the full resolution files
from data/raw/layers/ and writes a block-averaged copy to data/layers/, the
copy that is committed and served on a clean checkout (method per layer in
``app.terrain.layers.DOWNSAMPLE_METHODS``).

Usage:
    python backend/scripts/make_layers.py
    python backend/scripts/make_layers.py --region mons-mouton --layers elevation slope
    python backend/scripts/make_layers.py --bundle          # factor 2: 40 m, 1 MB per layer
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import numpy as np

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.settings import get_settings  # noqa: E402
from app.terrain.dem import read_window  # noqa: E402
from app.terrain.layers import (  # noqa: E402
    LAYER_DESCRIPTIONS,
    LAYER_SOURCES,
    LAYER_TITLES,
    LAYER_UNITS,
    REGIONS,
    LayerMeta,
    bundled_layers_dir,
    downsample_layer,
    layers_dir,
    load_layer,
    save_layer,
)
from app.terrain.projection import latlon_to_xy  # noqa: E402

DEFAULT_LAYERS = ["elevation", "hillshade", "slope", "psr"]


def make_region(region_id: str, names: list[str], out_dir: Path) -> None:
    region = REGIONS[region_id]
    x, y = latlon_to_xy(region.lat_deg, region.lon_deg)
    grid_key = None
    for name in names:
        product, url = LAYER_SOURCES[name]
        t0 = time.perf_counter()
        window = read_window(url, float(x), float(y), region.half_size_m)
        rows, cols = window.data.shape
        key = (rows, cols, round(window.x_min, 6), round(window.y_max, 6), window.resolution_m)
        if grid_key is None:
            grid_key = key
        elif key != grid_key:
            raise SystemExit(f"{name}: grid {key} differs from the first layer's grid {grid_key}")

        meta = LayerMeta(
            name=name,
            region=region.id,
            rows=rows,
            cols=cols,
            x_min=window.x_min,
            y_min=window.y_min,
            x_max=window.x_max,
            y_max=window.y_max,
            resolution_m=window.resolution_m,
            unit=LAYER_UNITS[name],
            product=product,
            url=url,
            validity="MEASURED",
            title=LAYER_TITLES[name],
            description=LAYER_DESCRIPTIONS[name],
        )
        save_layer(out_dir, meta, window.data.astype(np.float32))
        finite = window.data[np.isfinite(window.data)]
        print(
            f"{region.id}/{name}: {rows} x {cols} at {window.resolution_m:g} m, "
            f"range {finite.min():.2f} .. {finite.max():.2f} {meta.unit}, "
            f"nodata {window.data.size - finite.size}, {time.perf_counter() - t0:.1f} s"
        )


def bundle_region(region_id: str, names: list[str], raw_dir: Path, out_dir: Path,
                  factor: int) -> None:
    total = 0
    for name in names:
        small = downsample_layer(load_layer(raw_dir, region_id, name), factor)
        save_layer(out_dir, small.meta, small.values)
        size = small.values.nbytes
        total += size
        m = small.meta
        print(f"{region_id}/{name}: {m.rows} x {m.cols} at {m.resolution_m:g} m "
              f"({m.downsample_method}), {size / 1e6:.2f} MB")
    print(f"{region_id}: {total / 1e6:.2f} MB in {out_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--region", nargs="+", default=list(REGIONS), choices=list(REGIONS))
    parser.add_argument(
        "--layers", nargs="+", default=DEFAULT_LAYERS, choices=list(LAYER_SOURCES)
    )
    parser.add_argument("--out-dir", type=Path, default=None,
                        help="default: data/raw/layers (data/layers with --bundle)")
    parser.add_argument("--bundle", action="store_true",
                        help="write the downsampled copy from data/raw/layers to data/layers")
    parser.add_argument("--factor", type=int, default=2, help="block size for --bundle")
    args = parser.parse_args()

    data_dir = get_settings().data_dir
    if args.bundle:
        # All layers of a region share one grid, so the bundle always holds all four.
        if sorted(args.layers) != sorted(DEFAULT_LAYERS):
            parser.error("--bundle writes all four layers; drop --layers")
        out_dir = args.out_dir or bundled_layers_dir(data_dir)
        for region_id in args.region:
            bundle_region(region_id, args.layers, layers_dir(data_dir), out_dir, args.factor)
        return
    out_dir = args.out_dir or layers_dir(data_dir)
    for region_id in args.region:
        make_region(region_id, args.layers, out_dir)


if __name__ == "__main__":
    main()
