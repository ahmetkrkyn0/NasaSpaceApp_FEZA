"""Map layers: stored grids for a region, served as raw float32 arrays.

``backend/scripts/make_layers.py`` reads one window per layer from the PGDA 90
maps and writes two files per layer under ``data/raw/layers/`` (full
resolution, not committed); ``--bundle`` writes a block-averaged copy under
``data/layers/`` that ships with the repository. The server reads the full
resolution copy when it exists and the bundled one otherwise. Each copy has:

- ``<region>_<name>.f32``: row-major little-endian float32, north up, NaN for
  missing cells;
- ``<region>_<name>.json``: the grid description (``LayerMeta``).

All layers of a region share one grid (ADR-0004, "Harita katmanı adları").
The transport is the reference interface's (frontend-migrate/DESIGN.md, 6.3):
shape, range and validity travel in ``X-Layer-*`` headers; grid bounds go in
``X-Layer-Bounds`` as ``x_min,y_min,x_max,y_max`` in south polar
stereographic metres.
"""

from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np

PGDA90_BASE_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp"

LAYER_NAMES: tuple[str, ...] = ("hillshade", "elevation", "slope", "psr")
"""Layer names of ADR-0004."""

LAYER_SOURCES: dict[str, tuple[str, str]] = {
    "elevation": ("PGDA 90 LDEM_80S_20MPP_ADJ", f"{PGDA90_BASE_URL}/LDEM_80S_20MPP_ADJ.TIF"),
    "hillshade": (
        "PGDA 90 LDEM_80S_20MPP_ADJ_HILL",
        f"{PGDA90_BASE_URL}/LDEM_80S_20MPP_ADJ_HILL.TIF",
    ),
    "slope": ("PGDA 90 LDSM_80S_20MPP_ADJ", f"{PGDA90_BASE_URL}/LDSM_80S_20MPP_ADJ.TIF"),
    "psr": ("PGDA 90 LPSR_80S_20MPP_ADJ", f"{PGDA90_BASE_URL}/LPSR_80S_20MPP_ADJ.TIF"),
}
"""Source map per layer; all four share the 20 m south polar grid
(dogrulama/veri-kaynaklari.md, No 17, 20, 22 and 23). ``psr`` is the
permanent shadow mask: 1 permanently shadowed, 0 not, NaN no data."""

LAYER_TITLES: dict[str, str] = {
    "elevation": "Elevation",
    "hillshade": "Hillshade",
    "slope": "Slope",
    "psr": "Permanent shadow",
}

LAYER_DESCRIPTIONS: dict[str, str] = {
    "elevation": "Height above the 1737.4 km reference sphere, from the LOLA 20 m map.",
    "hillshade": "Shaded relief of the LOLA 20 m map.",
    "slope": "Surface slope of the LOLA 20 m map.",
    "psr": (
        "Areas that receive no direct sunlight over the long term (NASA LOLA 20 m mask): "
        "1 permanently shadowed, 0 not. Shadow only. Ice presence is uncertain."
    ),
}
"""Name and description shown with a layer (kalici-golge-katmani.md, 6: the
``psr`` text makes no ice claim)."""

DOWNSAMPLE_METHODS: dict[str, str] = {
    "elevation": "mean",
    "hillshade": "mean",
    "slope": "mean",
    "psr": "fraction",
}
"""How a bundled layer combines each block of 20 m cells: ``mean`` is the mean
of the valid cells; ``fraction`` (``psr``) is the share of permanently
shadowed cells, so a bundled ``psr`` cell is a value from 0 to 1. A block with
no valid cell stays NaN. The full resolution maximum is kept in
``source_max``, since block means lower the peaks (slope above all)."""

BUNDLED_PSR_NOTE = (
    "In the bundled copy each cell is the fraction of its 20 m cells that are "
    "permanently shadowed."
)

LAYER_UNITS: dict[str, str] = {
    "elevation": "m",
    "hillshade": "DN",
    "slope": "deg",
    "psr": "1",
}


@dataclass(frozen=True)
class Region:
    """A square map region around a catalogue site."""

    id: str
    site_id: str
    lat_deg: float
    lon_deg: float
    half_size_m: float


REGIONS: dict[str, Region] = {
    "mons-mouton": Region(
        id="mons-mouton",
        site_id="mons-mouton-im2-target",
        lat_deg=-84.78,
        lon_deg=29.13,
        half_size_m=10_000.0,
    ),
}
"""Regions of ADR-0004; the first version has only ``mons-mouton``. The centre
is the ``mons-mouton-im2-target`` record of ``data/sites.json``."""


@dataclass(frozen=True)
class WideRegion:
    """A wide elevation-only region, stored block-averaged.

    It gives the terrain around the detailed regions for views that zoom out
    and for shadows cast from far away. Only ``elevation`` exists for it."""

    id: str
    lat_deg: float
    lon_deg: float
    half_size_m: float
    product: str
    url: str
    factor: int
    description: str


WIDE_REGIONS: dict[str, WideRegion] = {
    "south-pole-cap": WideRegion(
        id="south-pole-cap",
        lat_deg=-90.0,
        lon_deg=0.0,
        # 80 S is 304 km from the pole on the map: 2 R tan(5 deg).
        half_size_m=304_000.0,
        product="PGDA 90 LDEM_80S_80MPP_ADJ",
        url=f"{PGDA90_BASE_URL}/LDEM_80S_80MPP_ADJ.TIF",
        factor=4,
        description=(
            "Height above the 1737.4 km reference sphere from 80 S to the pole, "
            "block means of the LOLA 80 m map."
        ),
    ),
}
"""Wide regions: the whole map of the 80 m product, stored at 320 m."""

WIDE_LAYER_NAME = "elevation"


def find_wide_layer(data_dir: Path, region: str) -> "Layer":
    """Load the elevation of a wide region: the copy under ``data/raw/layers``
    when present, else the one under ``data/layers``. Raises
    ``FileNotFoundError`` when neither exists."""

    for directory in layer_dirs(data_dir):
        if layer_exists(directory, region, WIDE_LAYER_NAME):
            return load_layer(directory, region, WIDE_LAYER_NAME)
    raise FileNotFoundError(f"elevation of region {region} is not available")


@dataclass
class LayerMeta:
    """Description of a stored layer grid (the ``.json`` file)."""

    name: str
    region: str
    rows: int
    cols: int
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    resolution_m: float
    unit: str
    product: str
    url: str | None
    validity: str = "MEASURED"
    downsample: int = 1
    title: str = ""
    description: str = ""
    downsample_method: str | None = None
    source_max: float | None = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "LayerMeta":
        fields = cls.__dataclass_fields__
        return cls(**{key: data[key] for key in fields if key in data})


@dataclass
class Layer:
    """A loaded layer: grid description and row-major values."""

    meta: LayerMeta
    values: np.ndarray

    def headers(self) -> dict[str, str]:
        """Response headers of the f32 transport."""

        finite = self.values[np.isfinite(self.values)]
        m = self.meta
        headers = {
            "X-Layer-Name": m.name,
            "X-Layer-Rows": str(m.rows),
            "X-Layer-Cols": str(m.cols),
            "X-Layer-Resolution-M": _num(m.resolution_m),
            "X-Layer-Validity": m.validity,
            "X-Layer-Nodata": str(int(self.values.size - finite.size)),
            "X-Layer-Downsample": str(m.downsample),
            "X-Layer-Bounds": ",".join(_num(v) for v in (m.x_min, m.y_min, m.x_max, m.y_max)),
            "X-Layer-Unit": m.unit,
            "X-Layer-Source": m.product,
        }
        # An all-NaN grid still sends both headers, as "nan" (read as null).
        headers["X-Layer-Min"] = _num(float(finite.min())) if finite.size else "nan"
        headers["X-Layer-Max"] = _num(float(finite.max())) if finite.size else "nan"
        return headers


def _num(value: float) -> str:
    return f"{value:.6f}".rstrip("0").rstrip(".") if math.isfinite(value) else "nan"


def layers_dir(data_dir: Path) -> Path:
    """``<data_dir>/raw/layers``: full resolution copy, built locally."""

    return Path(data_dir) / "raw" / "layers"


def bundled_layers_dir(data_dir: Path) -> Path:
    """``<data_dir>/layers``: downsampled copy committed to the repository."""

    return Path(data_dir) / "layers"


def layer_dirs(data_dir: Path) -> tuple[Path, Path]:
    """Folders searched for a layer, in order: full resolution, then bundled."""

    return layers_dir(data_dir), bundled_layers_dir(data_dir)


def layer_exists(directory: Path, region: str, name: str) -> bool:
    return all(path.is_file() for path in layer_paths(directory, region, name))


def region_layer_dir(data_dir: Path, region: str) -> Path | None:
    """Folder that serves ``region``: the full resolution folder only when it
    holds all of the region's layers, else the bundled folder when that does.
    One folder per region keeps every layer on one grid (ADR-0004)."""

    for directory in layer_dirs(data_dir):
        if all(layer_exists(directory, region, name) for name in LAYER_NAMES):
            return directory
    return None


def find_layer(data_dir: Path, region: str, name: str) -> Layer:
    """Load ``region``/``name`` from ``region_layer_dir``. Raises
    ``FileNotFoundError`` when no folder holds the whole region."""

    directory = region_layer_dir(data_dir, region)
    if directory is None:
        raise FileNotFoundError(f"layers of region {region} are not available")
    return load_layer(directory, region, name)


def layers_available(data_dir: Path) -> bool:
    """True when every region has a folder holding all of its layers."""

    return all(region_layer_dir(data_dir, region) is not None for region in REGIONS)


def downsample_values(values: np.ndarray, factor: int) -> np.ndarray:
    """Mean of the valid cells in each ``factor`` x ``factor`` block.

    Rows and columns that do not fill a whole block are dropped; a block
    without a valid cell is NaN. For a 0/1 mask the mean is the fraction of
    ones, which is the ``fraction`` method."""

    values = np.asarray(values, dtype=np.float64)
    rows, cols = (values.shape[0] // factor) * factor, (values.shape[1] // factor) * factor
    blocks = values[:rows, :cols].reshape(rows // factor, factor, cols // factor, factor)
    valid = np.isfinite(blocks)
    count = valid.sum(axis=(1, 3))
    total = np.where(valid, blocks, 0.0).sum(axis=(1, 3))
    with np.errstate(invalid="ignore", divide="ignore"):
        out = np.where(count > 0, total / count, np.nan)
    return out.astype(np.float32)


def downsample_layer(layer: Layer, factor: int) -> Layer:
    """Block-averaged copy of a full resolution layer (``DOWNSAMPLE_METHODS``)."""

    m = layer.meta
    if not 2 <= factor <= min(m.rows, m.cols):
        raise ValueError(f"factor must be between 2 and {min(m.rows, m.cols)}, got {factor}")
    values = downsample_values(layer.values, factor)
    rows, cols = values.shape
    finite = layer.values[np.isfinite(layer.values)]
    description = m.description
    if m.name == "psr" and BUNDLED_PSR_NOTE not in description:
        description = description.replace("Shadow only.", f"{BUNDLED_PSR_NOTE} Shadow only.")
    meta = LayerMeta.from_dict({
        **m.to_dict(),
        "rows": rows,
        "cols": cols,
        # The bounds shrink only if a partial block was dropped.
        "x_max": m.x_min + cols * factor * m.resolution_m,
        "y_min": m.y_max - rows * factor * m.resolution_m,
        "resolution_m": m.resolution_m * factor,
        "downsample": m.downsample * factor,
        "downsample_method": DOWNSAMPLE_METHODS[m.name],
        # Block means and fractions are the team's own computation.
        "validity": "DERIVED",
        "source_max": float(finite.max()) if finite.size else None,
        "description": description,
    })
    return Layer(meta=meta, values=values)


def layer_paths(directory: Path, region: str, name: str) -> tuple[Path, Path]:
    """Paths of the value file and the description file."""

    stem = Path(directory) / f"{region}_{name}"
    return stem.with_suffix(".f32"), stem.with_suffix(".json")


def save_layer(directory: Path, meta: LayerMeta, values: np.ndarray) -> None:
    """Write a layer as ``.f32`` and ``.json``."""

    values = np.asarray(values, dtype="<f4")
    if values.shape != (meta.rows, meta.cols):
        raise ValueError(f"values shape {values.shape} != ({meta.rows}, {meta.cols})")
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    data_path, meta_path = layer_paths(directory, meta.region, meta.name)
    data_path.write_bytes(values.tobytes(order="C"))
    with open(meta_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(meta.to_dict(), f, indent=2)
        f.write("\n")


def load_layer(directory: Path, region: str, name: str) -> Layer:
    """Read a stored layer. Raises ``FileNotFoundError`` when it is missing
    and ``ValueError`` when the files do not agree."""

    data_path, meta_path = layer_paths(directory, region, name)
    if not data_path.is_file() or not meta_path.is_file():
        raise FileNotFoundError(f"layer {region}/{name} is not available")
    with open(meta_path, encoding="utf-8") as f:
        meta = LayerMeta.from_dict(json.load(f))
    raw = data_path.read_bytes()
    if len(raw) != meta.rows * meta.cols * 4:
        raise ValueError(f"layer {region}/{name}: {len(raw)} bytes for {meta.rows} x {meta.cols}")
    values = np.frombuffer(raw, dtype="<f4").reshape(meta.rows, meta.cols)
    return Layer(meta=meta, values=values)
