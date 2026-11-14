"""Map layers: stored grids for a region, served as raw float32 arrays.

``backend/scripts/make_layers.py`` reads one window per layer from the PGDA 90
maps and writes two files per layer under ``data/raw/layers/``:

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
"""Layer names of ADR-0004. ``psr`` is added by F3-B; until then it is missing."""

LAYER_SOURCES: dict[str, tuple[str, str]] = {
    "elevation": ("PGDA 90 LDEM_80S_20MPP_ADJ", f"{PGDA90_BASE_URL}/LDEM_80S_20MPP_ADJ.TIF"),
    "hillshade": (
        "PGDA 90 LDEM_80S_20MPP_ADJ_HILL",
        f"{PGDA90_BASE_URL}/LDEM_80S_20MPP_ADJ_HILL.TIF",
    ),
    "slope": ("PGDA 90 LDSM_80S_20MPP_ADJ", f"{PGDA90_BASE_URL}/LDSM_80S_20MPP_ADJ.TIF"),
}
"""Source map per layer; all three share the 20 m south polar grid
(dogrulama/veri-kaynaklari.md, No 17, 20 and 22)."""

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
        if finite.size:
            headers["X-Layer-Min"] = _num(float(finite.min()))
            headers["X-Layer-Max"] = _num(float(finite.max()))
        return headers


def _num(value: float) -> str:
    return f"{value:.6f}".rstrip("0").rstrip(".") if math.isfinite(value) else "nan"


def layers_dir(data_dir: Path) -> Path:
    """``<data_dir>/raw/layers``."""

    return Path(data_dir) / "raw" / "layers"


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
