"""Loaders for the JSON data files under the configured data directory.

The files are small, so they are read on every call. Record fields are passed
through untouched; unknown fields are kept so the API can expose them as-is.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.errors import DataUnavailable
from app.settings import get_settings

SITES_FILE = "sites.json"
PANEL_PROFILES_FILE = "panel_profiles.json"
REFERENCE_MISSIONS_FILE = "reference_missions.json"


def _load_list(file_name: str) -> list[dict]:
    """Read ``file_name`` from the data directory and return its records."""

    path: Path = get_settings().data_dir / file_name
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise DataUnavailable(f"Data file {file_name} is not available.") from exc

    try:
        data = json.loads(text)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise DataUnavailable(f"Data file {file_name} is not available.") from exc

    if not isinstance(data, list):
        raise DataUnavailable(f"Data file {file_name} is not available.")
    return data


def load_sites() -> list[dict]:
    """Return the landing site records from ``sites.json``."""

    return _load_list(SITES_FILE)


def load_panel_profiles() -> list[dict]:
    """Return the solar panel profile records from ``panel_profiles.json``."""

    return _load_list(PANEL_PROFILES_FILE)


def load_reference_missions() -> list[dict]:
    """Return the reference mission records from ``reference_missions.json``."""

    return _load_list(REFERENCE_MISSIONS_FILE)


def find_site(site_id: str) -> dict | None:
    """Return the site record with ``site_id``, or ``None`` when it is unknown.

    Catalogue sites come first; a candidate region id (``cand-NN``,
    ``data/candidates.json``) resolves too, so every endpoint that takes a
    location accepts it (#97, 4.3). ``load_sites`` and ``/api/sites`` keep only
    the catalogue."""

    for site in load_sites():
        if site.get("id") == site_id:
            return site
    from app.terrain.candidates import find_candidate

    return find_candidate(get_settings().data_dir, site_id)
