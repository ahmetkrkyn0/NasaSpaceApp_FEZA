"""``data/ground_stations.json`` against its source (DSN 810-005, module 301, Rev. P, Table 5)."""

import json
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[2]
DATA = BACKEND.parent / "data"
FIXTURE = BACKEND / "tests" / "fixtures" / "ground_stations.json"

FIELDS = {"id", "name", "lat_deg", "lon_deg", "elevation_m", "source", "validity"}
SOURCE_URL = "https://deepspace.jpl.nasa.gov/dsndocs/810-005/301/301P.pdf"

# Table 5, WGS 84: latitude and east longitude (deg, min, sec), height (m).
# Southern latitudes: deg, min and sec are all negative (note 3 of the table).
TABLE_5 = {
    "dsn-goldstone": ("DSS 14", (35, 25, 33.24312), (243, 6, 37.66244), 1001.390),
    "dsn-madrid": ("DSS 63", (40, 25, 52.35510), (355, 45, 7.16924), 864.816),
    "dsn-canberra": ("DSS 43", (-35, -24, -8.72724), (148, 58, 52.56231), 688.867),
}


def _deg(dms: tuple[float, float, float]) -> float:
    d, m, s = dms
    return d + m / 60 + s / 3600


def _wrap(lon_deg: float) -> float:
    return (lon_deg + 180.0) % 360.0 - 180.0


@pytest.fixture(scope="module")
def stations() -> list[dict]:
    return json.loads((DATA / "ground_stations.json").read_text(encoding="utf-8"))


def test_stations_match_table_5(stations: list[dict]) -> None:
    assert [s["id"] for s in stations] == list(TABLE_5)
    for station in stations:
        antenna, lat, lon, height = TABLE_5[station["id"]]
        assert set(station) == FIELDS
        assert station["lat_deg"] == pytest.approx(_deg(lat), abs=5e-7)
        assert station["lon_deg"] == pytest.approx(_wrap(_deg(lon)), abs=5e-7)
        assert station["elevation_m"] == pytest.approx(height, abs=1e-6)
        assert station["source"]["url"] == SOURCE_URL
        assert antenna in station["source"]["label"]
        assert station["validity"] == "MEASURED"


def test_fixture_copy_matches_the_data_file(stations: list[dict]) -> None:
    assert json.loads(FIXTURE.read_text(encoding="utf-8")) == stations
