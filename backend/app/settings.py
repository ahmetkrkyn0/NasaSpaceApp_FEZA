"""Runtime settings read from the environment."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

KERNEL_FILES: tuple[str, ...] = (
    "naif0012.tls",
    "pck00011.tpc",
    "de440s.bsp",
    "moon_pa_de440_200625.bpc",
    "moon_de440_250416.tf",
)

REPO_ROOT: Path = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    """Resolved data locations for one request."""

    data_dir: Path
    kernel_dir: Path
    dem_dir: Path


def get_settings() -> Settings:
    """Read the settings from the environment on every call."""
    data_dir = Path(os.environ.get("FEZA_DATA_DIR", REPO_ROOT / "data"))
    kernel_dir = Path(os.environ.get("FEZA_KERNEL_DIR", data_dir / "raw" / "kernels"))
    dem_dir = data_dir / "raw" / "dem"
    return Settings(data_dir=data_dir, kernel_dir=kernel_dir, dem_dir=dem_dir)
