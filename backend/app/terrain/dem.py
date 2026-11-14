"""Reading windows from the PGDA 90 height maps.

The maps are cloud-optimized GeoTIFFs of several gigabytes. They are not
downloaded: only the window around a site is read over HTTP range requests
(docs/design/veri-kaynaklari-ve-on-hesap.md, "Verinin alınması";
dogrulama/veri-kaynaklari.md, No 27 and 28). Heights are metres relative to
the 1737.4 km sphere, grid in south polar stereographic metres (No 17, 19).

rasterio is imported lazily so the rest of the terrain package works
without it.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .projection import latlon_to_xy

PGDA90_LDEM_20M_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF"
"""PGDA 90 height map, 20 m per pixel, 80 S to the pole (No 18 and 21).

The file carries internal overviews at 2, 4, 8, 16, 32 and 64 times the
base pixel size, so coarser grids for the far field come from the same file.
"""

PGDA90_PRODUCT = "PGDA 90 LDEM_80S_20MPP_ADJ"

GDAL_ENV = {
    "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
    "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".TIF,.tif",
    "GDAL_HTTP_MAX_RETRY": "3",
    "GDAL_HTTP_RETRY_DELAY": "2",
}


@dataclass
class GridWindow:
    """A north-up grid in projected metres.

    ``x_min`` and ``y_max`` are the outer edges of the top-left pixel.
    """

    data: np.ndarray
    x_min: float
    y_max: float
    resolution_m: float

    @property
    def x_max(self) -> float:
        return self.x_min + self.data.shape[1] * self.resolution_m

    @property
    def y_min(self) -> float:
        return self.y_max - self.data.shape[0] * self.resolution_m

    def sample_xy(self, x_m, y_m) -> np.ndarray:
        """Bilinear height at projected points; NaN outside the grid."""
        x = np.asarray(x_m, dtype=float)
        y = np.asarray(y_m, dtype=float)
        col = (x - self.x_min) / self.resolution_m - 0.5
        row = (self.y_max - y) / self.resolution_m - 0.5
        rows, cols = self.data.shape

        inside = (col >= 0) & (col <= cols - 1) & (row >= 0) & (row <= rows - 1)
        c0 = np.clip(np.floor(col).astype(int), 0, max(cols - 2, 0))
        r0 = np.clip(np.floor(row).astype(int), 0, max(rows - 2, 0))
        c1 = np.minimum(c0 + 1, cols - 1)
        r1 = np.minimum(r0 + 1, rows - 1)
        fc = np.clip(col - c0, 0.0, 1.0)
        fr = np.clip(row - r0, 0.0, 1.0)

        d = self.data
        top = d[r0, c0] * (1 - fc) + d[r0, c1] * fc
        bottom = d[r1, c0] * (1 - fc) + d[r1, c1] * fc
        value = top * (1 - fr) + bottom * fr
        return np.where(inside, value, np.nan)

    def sample_latlon(self, lat_deg, lon_deg) -> np.ndarray:
        x, y = latlon_to_xy(lat_deg, lon_deg)
        return self.sample_xy(x, y)


class LayeredSampler:
    """Uses the first grid that has a value at a point (fine grids first)."""

    def __init__(self, grids: list[GridWindow]):
        if not grids:
            raise ValueError("at least one grid is needed")
        self.grids = grids

    def __call__(self, lat_deg, lon_deg) -> np.ndarray:
        x, y = latlon_to_xy(lat_deg, lon_deg)
        x = np.atleast_1d(x)
        y = np.atleast_1d(y)
        out = np.full(x.shape, np.nan)
        for grid in self.grids:
            missing = ~np.isfinite(out)
            if not missing.any():
                break
            out[missing] = grid.sample_xy(x[missing], y[missing])
        return out


def read_window(
    url: str,
    center_x_m: float,
    center_y_m: float,
    half_size_m: float,
    overview_level: int | None = None,
) -> GridWindow:
    """Read a square window around a projected point.

    ``url`` may be an http(s) address (read through GDAL's ``/vsicurl/``) or
    a local file path. ``overview_level`` picks an internal overview
    (0 is the first, 2 times coarser); ``None`` reads full resolution.
    The window is clipped to the map; nodata becomes NaN.
    """
    import rasterio
    from rasterio.windows import Window, from_bounds

    path = f"/vsicurl/{url}" if url.startswith(("http://", "https://")) else url
    open_kwargs = {} if overview_level is None else {"overview_level": overview_level}

    with rasterio.Env(**GDAL_ENV), rasterio.open(path, **open_kwargs) as ds:
        win = from_bounds(
            center_x_m - half_size_m,
            center_y_m - half_size_m,
            center_x_m + half_size_m,
            center_y_m + half_size_m,
            ds.transform,
        )
        win = win.round_offsets().round_lengths()
        win = win.intersection(Window(0, 0, ds.width, ds.height))
        data = ds.read(1, window=win, masked=True).astype(np.float64).filled(np.nan)
        transform = ds.window_transform(win)

    if abs(transform.a + transform.e) > 1e-9 or transform.b or transform.d:
        raise ValueError("only north-up square-pixel grids are supported")
    return GridWindow(
        data=data, x_min=transform.c, y_max=transform.f, resolution_m=transform.a
    )
