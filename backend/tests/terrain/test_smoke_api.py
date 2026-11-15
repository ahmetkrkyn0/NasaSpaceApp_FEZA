"""``backend/scripts/smoke_api.py`` with a stubbed caller."""

import importlib.util
import json
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "smoke_api.py"
spec = importlib.util.spec_from_file_location("smoke_api", SCRIPT)
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def _caller(fail_path=None):
    def call(method, path, params, body):
        if path == fail_path:
            return 503, json.dumps({"error": {"code": "data_unavailable"}}).encode()
        if path == "/api/sites":
            return 200, json.dumps([{"id": "a"}, {"id": "b"}]).encode()
        if path == "/api/candidates":
            return 200, json.dumps({"candidates": [{"id": "cand-01", "kind": "candidate"},
                                                   {"id": "a", "kind": "catalogue"}]}).encode()
        if path == "/api/panel-profiles":
            return 200, json.dumps([{"id": "p"}]).encode()
        return 200, b"{}"

    return call


def test_plan_covers_sites_candidates_layers_and_compare():
    requests = smoke.plan(_caller())
    labels = [r[0] for r in requests]
    assert {f"layers/{n}" for n in smoke.LAYERS} <= set(labels)
    assert "compare" in labels
    located = {r[3]["site_id"] for r in requests if r[3] and "site_id" in r[3]}
    assert located == {"a", "b", "cand-01"}  # catalogue entries of candidates.json are not repeated
    assert labels.count("events") == 3


def test_non_200_is_reported_and_fails():
    outcome = smoke.run(_caller(fail_path="/api/layers/psr"))
    assert [r["path"] for r in outcome["failed"]] == ["/api/layers/psr"]
    text = smoke.report(outcome)
    assert "503 GET /api/layers/psr" in text and "data_unavailable" in text
    assert not smoke.run(_caller())["failed"]
