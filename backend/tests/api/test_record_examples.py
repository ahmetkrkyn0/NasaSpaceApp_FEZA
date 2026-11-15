"""Offline recordings are repeatable and preserve the API response contracts."""

import importlib.util
import json
from pathlib import Path


def recorder():
    path = Path(__file__).resolve().parents[2] / "scripts" / "record_examples.py"
    spec = importlib.util.spec_from_file_location("record_examples", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_recording_is_repeatable_and_covers_every_place(tmp_path):
    module = recorder()

    def call(method, endpoint, params, body):
        if endpoint == "sites":
            return [{"id": "change-4", "name": "Chang'e 4"}]
        if endpoint == "candidates":
            return {"candidates": [{"id": "cand-01", "name": "Candidate 1"}]}
        if endpoint == "health":
            return {"ok": True, "kernels_loaded": True}
        return {"endpoint": endpoint}

    for folder in (tmp_path / "a", tmp_path / "b"):
        module.record(call, folder, recorded_utc="2026-11-15T08:00:00Z", main_sha="abc")
    a = {p.relative_to(tmp_path / "a"): p.read_bytes() for p in (tmp_path / "a").rglob("*.json")}
    b = {p.relative_to(tmp_path / "b"): p.read_bytes() for p in (tmp_path / "b").rglob("*.json")}
    assert a == b
    for place in ("change-4", "cand-01"):
        for endpoint in module.SITE_ENDPOINTS:
            envelope = json.loads(a[Path(place) / f"{endpoint}.json"])
            assert envelope["params"]["site_id"] == place
            assert envelope["main_sha"] == "abc"
            assert envelope["recorded_utc"] == "2026-11-15T08:00:00Z"
            assert envelope["response"] == {"endpoint": endpoint}


def test_recording_rejects_an_unready_server(tmp_path):
    import pytest

    with pytest.raises(RuntimeError, match="kernels"):
        recorder().record(lambda *args: {"ok": True, "kernels_loaded": False}, tmp_path)


def test_all_committed_recordings_fit_the_response_contracts():
    from pydantic import TypeAdapter
    from app.models.bodies import BodySeries
    from app.models.earth_link import EarthLink
    from app.models.events import CommWindow, EventList, NowStatus
    from app.models.power import PowerSeries
    from app.models.recommend import RecommendResponse
    from app.models.sky import SkySeries
    from app.terrain.horizon import HorizonProfile

    root = Path(__file__).resolve().parents[3] / "data/examples/recorded"
    manifest = json.loads((root / "index.json").read_text(encoding="utf-8"))
    models = {
        "events": EventList, "eclipses": EventList, "sky-series": SkySeries,
        "now": NowStatus, "comm-window": CommWindow, "power": PowerSeries,
        "earth-link": EarthLink, "horizon": HorizonProfile,
        "body-series": BodySeries, "recommend": RecommendResponse,
    }
    assert len(manifest["places"]) == 22
    assert sum(p.stat().st_size for p in root.rglob("*.json")) <= 6_000_000
    for path in root.glob("*/*.json"):
        envelope = json.loads(path.read_text(encoding="utf-8"))
        assert envelope["recorded_utc"] == manifest["recorded_utc"], path
        assert envelope["main_sha"] == manifest["main_sha"], path
        assert envelope["server_version"]
        assert envelope["endpoint"] == f"/api/{path.stem}"
        if path.stem in models:
            TypeAdapter(models[path.stem]).validate_python(envelope["response"])
        if path.stem == "horizon":
            assert len(envelope["response"]["horizon_deg"]) == 720
        if path.stem == "candidates":
            assert len(envelope["response"]["candidates"]) >= 12
    for place in manifest["places"]:
        assert {p.stem for p in (root / place["id"]).glob("*.json")} == set(recorder().SITE_ENDPOINTS)


def test_scenario_references_are_backed_by_the_recordings_and_verified_rows():
    root = Path(__file__).resolve().parents[3]
    presets = json.loads((root / "frontend/src/content/scenarios.json").read_text(encoding="utf-8"))["scenarios"]
    for preset in presets:
        for source in preset["sources"]:
            text = (root / source["file"]).read_text(encoding="utf-8")
            if source["file"].endswith("aciklanabilirlik.md"):
                line = next(line for line in text.splitlines() if line.startswith(f"| {source['row']} |"))
                assert "| doğrulandı |" in line
        for site in preset["sites"]:
            assert (root / "data/examples/recorded" / site / "events.json").is_file()
    recommendation = next(p for p in presets if p["id"] == "recommendation")
    ranking = json.loads((root / "data/examples/recorded/region/recommend.json").read_text(encoding="utf-8"))["response"]
    assert recommendation["sites"][0] == ranking["ranked"][0]["site_id"]
