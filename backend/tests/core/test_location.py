"""Tests for app.core.location.resolve and normalize_lon."""

from __future__ import annotations

import math
from pathlib import Path

import pytest

from app.core.location import Location, normalize_lon, resolve
from app.errors import DataUnavailable, InvalidParameter, SiteNotFound

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"


@pytest.fixture()
def fixture_data_dir(monkeypatch: pytest.MonkeyPatch) -> Path:
    """Point the settings at the checked-in fixture data directory."""
    monkeypatch.setenv("FEZA_DATA_DIR", str(FIXTURES_DIR))
    return FIXTURES_DIR


def test_resolve_site_id_returns_site_coordinates(fixture_data_dir: Path) -> None:
    location = resolve(site_id="im2-athena")

    assert isinstance(location, Location)
    assert location.lat_deg == pytest.approx(-84.7906)
    assert location.lon_deg == pytest.approx(29.1957)
    assert location.site_id == "im2-athena"
    assert location.site is not None
    assert location.site["id"] == "im2-athena"
    assert location.site["status"] == "landed_tipped"


def test_resolve_unknown_site_id_raises_site_not_found(fixture_data_dir: Path) -> None:
    with pytest.raises(SiteNotFound) as excinfo:
        resolve(site_id="no-such-site")

    assert "no-such-site" in excinfo.value.message


def test_resolve_site_id_without_sites_file_raises_data_unavailable(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))

    with pytest.raises(DataUnavailable):
        resolve(site_id="im2-athena")


def test_resolve_custom_coordinates_normalizes_lon(fixture_data_dir: Path) -> None:
    location = resolve(lat_deg=-84.78, lon_deg=206.0148)

    assert location.lat_deg == pytest.approx(-84.78)
    assert location.lon_deg == pytest.approx(-153.9852, abs=1e-9)
    assert location.site_id is None
    assert location.site is None


@pytest.mark.parametrize(
    ("lon_deg", "expected"),
    [
        (360.0, 0.0),
        (180.0, 180.0),
        (-180.0, -180.0),
    ],
)
def test_resolve_lon_boundaries(
    fixture_data_dir: Path, lon_deg: float, expected: float
) -> None:
    location = resolve(lat_deg=0.0, lon_deg=lon_deg)

    assert location.lon_deg == pytest.approx(expected, abs=1e-9)


@pytest.mark.parametrize("lat_deg", [95.0, -91.0])
def test_resolve_lat_out_of_range(fixture_data_dir: Path, lat_deg: float) -> None:
    with pytest.raises(InvalidParameter) as excinfo:
        resolve(lat_deg=lat_deg, lon_deg=0.0)

    assert "lat_deg" in excinfo.value.message


@pytest.mark.parametrize("lon_deg", [361.0, -181.0])
def test_resolve_lon_out_of_range(fixture_data_dir: Path, lon_deg: float) -> None:
    with pytest.raises(InvalidParameter) as excinfo:
        resolve(lat_deg=0.0, lon_deg=lon_deg)

    assert "lon_deg" in excinfo.value.message


def test_resolve_only_lat_raises_invalid_parameter(fixture_data_dir: Path) -> None:
    with pytest.raises(InvalidParameter):
        resolve(lat_deg=-84.78)


def test_resolve_nan_lat_raises_invalid_parameter(fixture_data_dir: Path) -> None:
    with pytest.raises(InvalidParameter):
        resolve(lat_deg=math.nan, lon_deg=0.0)


def test_normalize_lon_wraps_into_range() -> None:
    assert normalize_lon(206.0148) == pytest.approx(-153.9852, abs=1e-9)
    assert normalize_lon(360.0) == pytest.approx(0.0, abs=1e-9)
    assert normalize_lon(180.0) == pytest.approx(180.0, abs=1e-9)
    assert normalize_lon(-180.0) == pytest.approx(-180.0, abs=1e-9)
