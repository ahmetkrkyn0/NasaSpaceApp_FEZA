"""Repository data files against the catalogue and ADR-0003."""

import json
import re
from pathlib import Path

import pytest

DATA = Path(__file__).resolve().parents[3] / "data"

VALIDITY = {"SYNTHETIC", "DERIVED", "MODEL", "MEASURED"}
CATEGORIES = {"apollo", "clps", "commercial", "international", "artemis_candidate", "test", "custom"}
STATUSES = {"landed", "landed_tipped", "crashed", "planned", "candidate", "reference"}
SITE_FIELDS = {
    "id", "name", "category", "lat_deg", "lon_deg", "elevation_m", "landing_utc",
    "status", "coordinate_source", "validity", "notes",
}
OPTIONAL_SITE_FIELDS = {"cards"}  # ADR-0003, "Site" extras (csa-bilgi-kartlari.md)

# csa-bilgi-kartlari.md, 4: the only card texts allowed, each backed by a
# "doğrulandı" row of docs/research/dogrulama/csa-ve-diger-ulkeler.md.
VERIFIED_CARDS = {
    "apollo-11": ("The landing gear of the Eagle lunar module was built in Canada.", "No 28"),
    "blue-ghost-1": (
        "Coatings from a Canadian testing laboratory flew on a NASA dust experiment aboard this lander.",
        "No 30",
    ),
}

# docs/design/saha-katalogu.md, "İlk liste": id, lat, lon, category, status.
CATALOGUE = [
    ("apollo-11", 0.67416, 23.47314, "apollo", "landed"),
    ("change-4", -45.4561, 177.5885, "international", "landed"),
    ("chandrayaan-3", -69.3741, 32.32, "international", "landed"),
    ("slim", -13.3160, 25.2510, "international", "landed_tipped"),
    ("im1-odysseus", -80.13, 1.44, "clps", "landed"),
    ("change-6", -41.6385, -153.9852, "international", "landed"),
    ("blue-ghost-1", 18.562, 61.810, "clps", "landed"),
    ("im2-athena", -84.7906, 29.1957, "clps", "landed_tipped"),
    ("mons-mouton-im2-target", -84.78, 29.13, "test", "reference"),
    ("hakuto-r-m2", 60.44, -4.6, "commercial", "crashed"),
]


def _load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def sites():
    return _load("sites.json")


def test_ten_sites_match_catalogue(sites):
    assert len(sites) == 10
    by_id = {s["id"]: s for s in sites}
    assert len(by_id) == 10
    for site_id, lat, lon, category, status in CATALOGUE:
        s = by_id[site_id]
        assert s["lat_deg"] == lat, site_id
        assert s["lon_deg"] == lon, site_id
        assert s["category"] == category, site_id
        assert s["status"] == status, site_id


def test_site_fields_and_ranges(sites):
    for s in sites:
        assert set(s) - OPTIONAL_SITE_FIELDS == SITE_FIELDS, s["id"]
        assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", s["id"])
        assert -90.0 <= s["lat_deg"] <= 90.0
        assert -180.0 <= s["lon_deg"] <= 180.0
        assert s["category"] in CATEGORIES
        assert s["status"] in STATUSES
        assert s["validity"] in VALIDITY
        assert set(s["coordinate_source"]) == {"label", "url"}
        assert s["coordinate_source"]["label"]
        if s["landing_utc"] is not None:
            assert re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", s["landing_utc"])


def test_two_mons_mouton_records_are_distinct(sites):
    by_id = {s["id"]: s for s in sites}
    target, athena = by_id["mons-mouton-im2-target"], by_id["im2-athena"]
    assert (target["lat_deg"], target["lon_deg"]) != (athena["lat_deg"], athena["lon_deg"])
    assert target["category"] == "test"
    assert athena["category"] == "clps"


def test_unverified_landing_times_are_null(sites):
    # Athena's landing time could not be verified (aciklanabilirlik.md, No 22).
    by_id = {s["id"]: s for s in sites}
    assert by_id["im2-athena"]["landing_utc"] is None


def test_panel_profiles():
    profiles = _load("panel_profiles.json")
    assert {p["type"] for p in profiles} == {
        "horizontal", "vertical_fixed", "vertical_tracking", "two_axis",
    }
    assert len(profiles) == 4
    for p in profiles:
        assert set(p) == {
            "id", "type", "area_m2", "efficiency", "fixed_azimuth_deg", "mast_height_m", "validity",
        }
        assert p["area_m2"] == 1.0
        assert p["efficiency"] == 0.27
        assert p["mast_height_m"] == 2.0
        assert p["validity"] == "SYNTHETIC"
        if p["type"] != "vertical_fixed":
            assert p["fixed_azimuth_deg"] is None


@pytest.mark.parametrize("height", [2, 10])
def test_mons_mouton_horizon_files(height):
    p = _load(f"horizons/mons-mouton-im2-target_{height}m.json")
    assert p["site_id"] == "mons-mouton-im2-target"
    assert p["mast_height_m"] == float(height)
    assert p["azimuth_step_deg"] == 0.5
    assert len(p["horizon_deg"]) == 720
    assert all(isinstance(v, float) for v in p["horizon_deg"])
    assert p["method"] == "terrain"
    assert p["validity"] == "DERIVED"
    assert p["max_range_km"] == 150.0
    dem = p["dem"]
    assert dem["product"] and dem["resolution_m"] > 0 and dem["url"].startswith("https://")


def test_10_m_horizon_never_above_2_m():
    low = _load("horizons/mons-mouton-im2-target_2m.json")["horizon_deg"]
    high = _load("horizons/mons-mouton-im2-target_10m.json")["horizon_deg"]
    assert all(h10 <= h2 for h2, h10 in zip(low, high))


def test_cards_are_verified_csa_contributions(sites):
    with_cards = {s["id"]: s["cards"] for s in sites if "cards" in s}
    assert set(with_cards) == set(VERIFIED_CARDS)
    for site_id, cards in with_cards.items():
        assert len(cards) == 1
        (card,) = cards
        assert set(card) == {"agency", "text", "source"}
        assert card["agency"] == "CSA"
        assert card["text"] == VERIFIED_CARDS[site_id][0]
        assert set(card["source"]) == {"label", "url"}
        assert card["source"]["label"]
        assert card["source"]["url"].startswith("https://")


def test_card_source_rows_are_verified():
    table = (DATA.parent / "docs" / "research" / "dogrulama" / "csa-ve-diger-ulkeler.md").read_text(encoding="utf-8")
    for _, row in VERIFIED_CARDS.values():
        number = row.split()[1]
        (line,) = [ln for ln in table.splitlines() if ln.startswith(f"| {number} |")]
        assert "| doğrulandı |" in line
