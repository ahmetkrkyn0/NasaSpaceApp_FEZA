"""Site recommendation scoring (#100; docs/design/saha-puani.md, section 4).

The event metrics are injected, so these tests need neither SPICE kernels nor
horizon files.
"""

from __future__ import annotations

import json
from itertools import permutations

import pytest

from app.core import recommend as rc
from app.errors import DataUnavailable, InvalidParameter

WEIGHTS = {"sunlit": 1.0, "dark": 1.0, "earth": 1.0, "slope": 1.0, "roughness": 0.5, "psr_distance": 0.0}

RECORDS = [
    {"id": "cand-01", "kind": "candidate", "name": "Candidate 1", "lat_deg": -84.8, "lon_deg": 29.2,
     "mean_slope_deg": 4.2, "max_slope_deg": 9.8, "slope_std_deg": 1.6, "distance_to_psr_km": 3.1,
     "validity": "DERIVED"},
    {"id": "cand-02", "kind": "candidate", "name": "Candidate 2", "lat_deg": -84.75, "lon_deg": 28.9,
     "mean_slope_deg": 6.8, "max_slope_deg": 11.5, "slope_std_deg": 2.4, "distance_to_psr_km": 1.4,
     "validity": "DERIVED"},
    {"id": "cand-03", "kind": "candidate", "name": "Candidate 3", "lat_deg": -84.83, "lon_deg": 29.6,
     "mean_slope_deg": 9.5, "max_slope_deg": 14.2, "slope_std_deg": 3.1, "distance_to_psr_km": 2.2,
     "validity": "DERIVED"},
    {"id": "cand-04", "kind": "candidate", "name": "Candidate 4", "lat_deg": -84.7, "lon_deg": 30.1,
     "mean_slope_deg": 2.0, "max_slope_deg": 5.0, "slope_std_deg": 0.9, "distance_to_psr_km": 0.6,
     "validity": "DERIVED"},
    {"id": "site-a", "kind": "catalogue", "name": "Catalogue A", "lat_deg": -84.78, "lon_deg": 29.13,
     "mean_slope_deg": 5.1, "max_slope_deg": 8.0, "slope_std_deg": 2.0, "distance_to_psr_km": 2.8,
     "validity": "DERIVED"},
]

EVENTS = {
    "cand-01": (0.57, 120.0, 0.83, "DERIVED"),
    "cand-02": (0.49, 180.0, 0.79, "DERIVED"),
    "cand-03": (0.55, 140.0, 0.80, "DERIVED"),
    "cand-04": (0.40, 300.0, 0.60, "DERIVED"),
    "site-a": (0.52, 330.0, 0.83, "SYNTHETIC"),
}


def fake_events(site_id, mast, start, end):
    sunlit, dark, earth, validity = EVENTS[site_id]
    return {"metrics": {"sunlit_fraction": sunlit, "longest_dark_hours": dark,
                        "earth_visible_fraction": earth}, "validity": validity}


@pytest.fixture(autouse=True)
def data_dir(monkeypatch, tmp_path):
    (tmp_path / "candidates.json").write_text(json.dumps(
        {"region": "mons-mouton", "method": {}, "candidates": RECORDS, "validity": "DERIVED"}), encoding="utf-8")
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    return tmp_path


def _request(**extra):
    body = {
        "region": "mons-mouton",
        "start_utc": "2026-12-01T00:00:00Z", "end_utc": "2026-12-31T00:00:00Z",
        "mast_height_m": 2, "weights": dict(WEIGHTS), "limits": {"max_slope_deg": 12.0},
        "psr_preference": "far", "include_catalogue_sites": True,
    }
    body.update(extra)
    return body


def _run(**extra):
    return rc.recommend(_request(**extra), event_metrics=fake_events)


def _order(result):
    return [s["site_id"] for s in result["ranked"]]


def test_normalization_follows_the_design():
    by_id = {s["site_id"]: s for s in _run()["ranked"]}
    parts = {p["metric"]: p for p in by_id["cand-01"]["components"]}
    assert parts["sunlit_fraction"]["normalized"] == 0.57
    assert parts["longest_dark_hours"]["normalized"] == round(1 - 120 / rc.DARK_CAP_HOURS, 3)
    assert parts["mean_slope_deg"]["normalized"] == round(1 - 4.2 / 12.0, 3)
    # Roughness and PSR distance scale against the region maximum (3.1 deg, 3.1 km).
    assert parts["slope_std_deg"]["normalized"] == round(1 - 1.6 / 3.1, 3)
    assert parts["distance_to_psr_km"]["normalized"] == 1.0
    assert [p["metric"] for p in by_id["cand-01"]["components"]] == [
        "sunlit_fraction", "longest_dark_hours", "earth_visible_fraction",
        "mean_slope_deg", "slope_std_deg", "distance_to_psr_km",
    ]
    assert {p["unit"] for p in by_id["cand-01"]["components"]} == {"1", "h", "deg", "km"}


def test_psr_preference_flips_the_distance_scale():
    far = {s["site_id"]: s for s in _run()["ranked"]}
    near = {s["site_id"]: s for s in _run(psr_preference="near")["ranked"]}
    f = next(p for p in far["cand-04"]["components"] if p["metric"] == "distance_to_psr_km")
    n = next(p for p in near["cand-04"]["components"] if p["metric"] == "distance_to_psr_km")
    assert f["normalized"] == round(0.6 / 3.1, 3)
    assert n["normalized"] == round(1 - 0.6 / 3.1, 3)


def test_no_permanent_shadow_in_the_region_is_farthest():
    site = {**RECORDS[0], "distance_to_psr_km": None, "events": fake_events("cand-01", 2, None, None)}
    caps = rc.scales(RECORDS, 12.0)
    for preference, expected in (("far", 1.0), ("near", 0.0)):
        part = rc.components(site, WEIGHTS, caps, preference)[-1]
        assert part["value"] is None and part["normalized"] == expected


def test_score_is_0_to_100_and_recomputes_from_components():
    result = _run()
    for site in result["ranked"]:
        if site["eliminated"]:
            continue
        assert 0 <= site["score"] <= 100
        parts = site["components"]
        weight = sum(p["weight"] for p in parts)
        again = 100 * sum(p["weight"] * p["normalized"] for p in parts) / weight
        assert round(again, 1) == site["score"]


def test_scored_sites_are_ordered_by_score():
    scores = [s["score"] for s in _run()["ranked"] if not s["eliminated"]]
    assert scores == sorted(scores, reverse=True)


def test_slope_limit_eliminates_and_sinks_to_the_end():
    result = _run()
    last = result["ranked"][-1]
    assert last["site_id"] == "cand-03"
    assert last["eliminated"] is True and last["score"] is None
    assert last["eliminated_by"] == ["max_slope_deg"]
    assert all(not s["eliminated"] and s["eliminated_by"] == [] for s in result["ranked"][:-1])

    strict = _run(limits={"max_slope_deg": 9.0})
    dropped = [s["site_id"] for s in strict["ranked"] if s["eliminated"]]
    assert set(dropped) == {"cand-01", "cand-02", "cand-03"}
    assert all(s["eliminated"] for s in strict["ranked"][-3:])
    assert strict["limits"] == {"max_slope_deg": 9.0}


@pytest.mark.parametrize("key", rc.WEIGHT_KEYS)
def test_raising_a_weight_never_demotes_a_site_that_is_better_on_it(key):
    metric = dict(zip(rc.WEIGHT_KEYS, (
        "sunlit_fraction", "longest_dark_hours", "earth_visible_fraction",
        "mean_slope_deg", "slope_std_deg", "distance_to_psr_km"))
    )[key]
    base_weights = dict.fromkeys(rc.WEIGHT_KEYS, 0.4)
    before = _run(weights=base_weights)
    after = _run(weights=dict(base_weights, **{key: 1.0}))
    norm = {s["site_id"]: next(p["normalized"] for p in s["components"] if p["metric"] == metric)
            for s in before["ranked"]}
    pos_before = {sid: i for i, sid in enumerate(_order(before))}
    pos_after = {sid: i for i, sid in enumerate(_order(after))}
    scored = [s["site_id"] for s in before["ranked"] if not s["eliminated"]]
    for a, b in permutations(scored, 2):
        if norm[a] >= norm[b] and pos_before[a] < pos_before[b]:
            assert pos_after[a] < pos_after[b], (a, b)


def test_all_zero_weights_is_invalid():
    with pytest.raises(InvalidParameter):
        _run(weights=dict.fromkeys(rc.WEIGHT_KEYS, 0.0))


@pytest.mark.parametrize("bad", [-0.1, 1.5])
def test_weight_out_of_range_is_invalid(bad):
    with pytest.raises(InvalidParameter):
        _run(weights=dict(WEIGHTS, sunlit=bad))


@pytest.mark.parametrize("extra", [
    {"limits": {"max_slope_deg": 0}},
    {"psr_preference": "middle"},
    {"region": "nowhere"},
    {"mast_height_m": -1},
    {"end_utc": "2026-11-30T00:00:00Z"},
])
def test_bad_parameters_are_invalid(extra):
    with pytest.raises(InvalidParameter):
        _run(**extra)


def test_missing_candidates_file_is_unavailable(data_dir):
    (data_dir / "candidates.json").unlink()
    with pytest.raises(DataUnavailable):
        _run()


def test_catalogue_sites_can_be_left_out_without_changing_the_scale():
    full = {s["site_id"]: s for s in _run()["ranked"]}
    only = {s["site_id"]: s for s in _run(include_catalogue_sites=False)["ranked"]}
    assert "site-a" in full and "site-a" not in only
    assert only["cand-01"]["score"] == full["cand-01"]["score"]


def test_validity_is_the_lowest_input():
    result = _run()
    by_id = {s["site_id"]: s for s in result["ranked"]}
    assert by_id["cand-01"]["validity"] == "DERIVED"
    assert by_id["site-a"]["validity"] == "SYNTHETIC"
    assert {p["validity"] for p in by_id["site-a"]["components"][:3]} == {"SYNTHETIC"}
    assert {p["validity"] for p in by_id["site-a"]["components"][3:]} == {"DERIVED"}
    assert result["validity"] == "SYNTHETIC"
    assert _run(include_catalogue_sites=False)["validity"] == "DERIVED"


def test_assumptions_name_the_scales_and_the_ranking_note():
    notes = _run()["assumptions"]
    assert any("does not certify a landing site" in n for n in notes)
    assert any("12 degrees" in n and "No 89" in n for n in notes)
    assert any(n.startswith("Assumed:") and "336 h" in n for n in notes)
    assert any(n.startswith("Assumed:") and "roughness" in n for n in notes)
    assert any(n.startswith("Assumed:") and "permanent shadow" in n for n in notes)
    assert any("flat horizon" in n for n in notes)
    custom = _run(limits={"max_slope_deg": 8.0})["assumptions"]
    assert any(n.startswith("Assumed: the 8 degree slope limit") for n in custom)


def test_event_metrics_are_cached_per_site_and_period(monkeypatch):
    calls = []

    def compute(observer, start, end, criterion):
        calls.append(observer)
        return {"metrics": {"sunlit_fraction": 0.5, "longest_dark_hours": 10.0,
                            "earth_visible_fraction": 0.5}, "validity": "DERIVED"}

    monkeypatch.setattr(rc.events, "compute_events", compute)
    monkeypatch.setattr(rc.events, "observer_for", lambda place, mast: place.site_id)
    monkeypatch.setattr(rc.location, "resolve", lambda sid: type("L", (), {"site_id": sid})())
    rc.clear_cache()
    try:
        rc.recommend(_request())
        assert len(calls) == len(RECORDS)
        rc.recommend(_request(weights=dict(WEIGHTS, dark=0.2), limits={"max_slope_deg": 9.0}))
        assert len(calls) == len(RECORDS)
        rc.recommend(_request(end_utc="2026-12-30T00:00:00Z"))
        assert len(calls) == 2 * len(RECORDS)
    finally:
        rc.clear_cache()
