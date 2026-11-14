"""Tests for the JSON data file loaders in app.core.catalog."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.core.catalog import (
    find_site,
    load_panel_profiles,
    load_reference_missions,
    load_sites,
)
from app.errors import DataUnavailable

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"


@pytest.fixture()
def fixture_data_dir(monkeypatch: pytest.MonkeyPatch) -> Path:
    """Point the settings at the checked-in fixture data directory."""
    monkeypatch.setenv("FEZA_DATA_DIR", str(FIXTURES_DIR))
    return FIXTURES_DIR


def _read_json(name: str) -> list[dict]:
    return json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8"))


def test_load_sites_returns_file_contents(fixture_data_dir: Path) -> None:
    sites = load_sites()

    assert isinstance(sites, list)
    assert sites == _read_json("sites.json")
    assert [site["id"] for site in sites] == [
        "mons-mouton-im2-target",
        "im2-athena",
        "change4",
    ]


def test_load_sites_keeps_unknown_fields(fixture_data_dir: Path) -> None:
    sites = load_sites()

    athena = next(site for site in sites if site["id"] == "im2-athena")
    assert athena["fixture_extra"] is True


def test_load_panel_profiles_returns_file_contents(fixture_data_dir: Path) -> None:
    profiles = load_panel_profiles()

    assert isinstance(profiles, list)
    assert profiles == _read_json("panel_profiles.json")
    assert [profile["id"] for profile in profiles] == [
        "vertical_tracking",
        "vertical_fixed",
    ]
    fixed = next(profile for profile in profiles if profile["id"] == "vertical_fixed")
    assert fixed["fixed_azimuth_deg"] == 0


def test_load_reference_missions_returns_file_contents(fixture_data_dir: Path) -> None:
    missions = load_reference_missions()

    assert isinstance(missions, list)
    assert missions == _read_json("reference_missions.json")
    assert [mission["id"] for mission in missions] == ["im2-athena", "change4"]


def test_find_site_hit(fixture_data_dir: Path) -> None:
    site = find_site("im2-athena")

    assert site is not None
    assert site["id"] == "im2-athena"
    assert site["lat_deg"] == -84.7906
    assert site["lon_deg"] == 29.1957


def test_find_site_miss(fixture_data_dir: Path) -> None:
    assert find_site("does-not-exist") is None


@pytest.mark.parametrize(
    "loader",
    [load_sites, load_panel_profiles, load_reference_missions],
)
def test_missing_data_dir_raises_data_unavailable(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, loader
) -> None:
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))

    with pytest.raises(DataUnavailable):
        loader()


@pytest.mark.parametrize(
    ("loader", "file_name"),
    [
        (load_sites, "sites.json"),
        (load_panel_profiles, "panel_profiles.json"),
        (load_reference_missions, "reference_missions.json"),
    ],
)
def test_invalid_json_raises_data_unavailable(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, loader, file_name: str
) -> None:
    (tmp_path / file_name).write_text("{not valid json", encoding="utf-8")
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))

    with pytest.raises(DataUnavailable):
        loader()
