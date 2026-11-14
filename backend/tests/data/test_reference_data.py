"""F2-B data files: new horizon profiles, reference missions, test vectors."""

import json
from pathlib import Path

import pytest

DATA = Path(__file__).resolve().parents[3] / "data"

TERRAIN_SITES = ["im2-athena", "im1-odysseus", "chandrayaan-3"]
EVIDENCE = {"official", "preliminary", "commentary"}

# docs/design/gecmis-gorev-vakalari.md, "İlk altı vaka"; azimuths from the T1
# table of docs/design/dogrulama-plani.md (docs/PLAN.md, 4.2).
MISSIONS = {
    "im2-athena": ("2025-03-06T17:30:00Z", 2.47, 65.67, 11.19),
    "blue-ghost-1": ("2025-03-02T08:34:00Z", 3.43, 91.62, None),
    "chandrayaan-3": ("2023-08-23T12:34:00Z", 8.61, 62.04, None),
    "im1-odysseus": ("2024-02-22T23:23:00Z", 10.47, 18.61, None),
    "slim": ("2024-01-19T15:20:00Z", 37.16, 81.66, None),
    "change-4": ("2019-01-03T02:26:00Z", 31.51, 50.70, -39.20),
}


def _load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


@pytest.mark.parametrize("site_id", TERRAIN_SITES)
@pytest.mark.parametrize("height", [2, 10])
def test_new_horizon_files(site_id, height):
    """F1-B criterion 6 for the three new sites."""
    sites = {s["id"]: s for s in _load("sites.json")}
    p = _load(f"horizons/{site_id}_{height}m.json")
    assert p["site_id"] == site_id
    assert p["lat_deg"] == sites[site_id]["lat_deg"]
    assert p["lon_deg"] == sites[site_id]["lon_deg"]
    assert p["mast_height_m"] == float(height)
    assert p["azimuth_step_deg"] == 0.5
    assert len(p["horizon_deg"]) == 720
    assert all(isinstance(v, float) for v in p["horizon_deg"])
    assert p["method"] == "terrain"
    assert p["validity"] == "DERIVED"
    assert p["max_range_km"] == 150.0
    dem = p["dem"]
    assert dem["product"].startswith("PGDA 90 LDEM_")
    assert dem["resolution_m"] > 0
    assert dem["url"].startswith("https://pgda.gsfc.nasa.gov/")


@pytest.mark.parametrize("site_id", TERRAIN_SITES)
def test_new_10_m_horizon_never_above_2_m(site_id):
    """F1-B criterion 7."""
    low = _load(f"horizons/{site_id}_2m.json")["horizon_deg"]
    high = _load(f"horizons/{site_id}_10m.json")["horizon_deg"]
    assert all(h10 <= h2 for h2, h10 in zip(low, high))


@pytest.fixture(scope="module")
def missions():
    return _load("reference_missions.json")


def test_reference_missions_are_the_first_six(missions):
    assert [m["id"] for m in missions] == list(MISSIONS)
    site_ids = {s["id"] for s in _load("sites.json")}
    for m in missions:
        assert m["site_id"] in site_ids


def test_reference_mission_expected_angles(missions):
    for m in missions:
        utc, sun_el, sun_az, earth_el = MISSIONS[m["id"]]
        assert m["landing_utc"] == utc
        assert m["expected"] == {
            "sun_elevation_deg": sun_el,
            "sun_azimuth_true_deg": sun_az,
            "earth_elevation_deg": earth_el,
        }


def test_reference_mission_validity_labels(missions):
    allowed = {"SYNTHETIC", "DERIVED", "MODEL", "MEASURED"}
    for m in missions:
        assert m["landing_utc_validity"] in allowed
    by_id = {m["id"]: m for m in missions}
    # Unverified landing times (dogrulama/aciklanabilirlik.md, No 22, 35, 56).
    for mission_id in ("im2-athena", "im1-odysseus", "chandrayaan-3"):
        assert by_id[mission_id]["landing_utc_validity"] == "SYNTHETIC"


def test_every_fact_has_evidence_and_source(missions):
    for m in missions:
        for fact in m["facts"]:
            assert set(fact) == {"text", "evidence", "source"}
            assert fact["text"].strip()
            assert fact["evidence"] in EVIDENCE
            assert fact["source"]["label"].strip()
            url = fact["source"]["url"]
            assert url is None or url.startswith("https://")


def test_chinese_missions_cite_only_official_sources(missions):
    """docs/design/saha-katalogu.md, section 8."""
    for m in missions:
        if m["id"].startswith("change-"):
            for fact in m["facts"]:
                assert fact["evidence"] == "official"
                assert fact["source"]["label"].startswith(("CNSA", "NASA"))


def test_reference_missions_match_example_shape(missions):
    example = _load("examples/reference-missions.json")
    assert set(missions[0]) == set(example[0])
    assert set(missions[0]["expected"]) == set(example[0]["expected"])
    assert set(missions[0]["facts"][0]) == set(example[0]["facts"][0])


def test_test_vectors():
    vectors = _load("examples/test_vectors.json")["vectors"]
    ids = [v["id"] for v in vectors]
    assert len(ids) == len(set(ids))
    assert {v["test"] for v in vectors} == {"T1", "T2a", "T2b", "T4", "T5", "T7"}
    for v in vectors:
        assert v["endpoint"].startswith("/api/")
        assert isinstance(v["params"], dict) and v["params"]
        assert v["unit"] and v["source"].startswith("docs/research/dogrulama/")
        assert ("expected_range" in v) or (v["expected"] is not None and v["threshold"] > 0)
    # T1: six missions with Sun azimuth and elevation, plus three Earth rows.
    assert sum(v["test"] == "T1" for v in vectors) == 15
