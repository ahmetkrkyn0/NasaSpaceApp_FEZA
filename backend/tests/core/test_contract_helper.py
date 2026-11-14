"""Tests for the contract comparison helpers in ``tests.contract``."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from tests import contract


def test_matching_dicts_pass() -> None:
    actual = {"a": 1, "b": {"c": 2, "d": [{"e": 3}]}}
    expected = {"a": 9, "b": {"c": 8, "d": [{"e": 7}]}}
    assert contract.diff_keys(actual, expected) == []


def test_missing_key_reported_with_path() -> None:
    actual = {"samples": [{"sun": {"elevation_deg": 1.0}}]}
    expected = {"samples": [{"sun": {"elevation_deg": 1.0, "radius_deg": 0.26}}]}
    differences = contract.diff_keys(actual, expected)
    assert differences == ["missing key: samples[0].sun.radius_deg"]


def test_extra_key_reported_with_path() -> None:
    actual = {"samples": [{"sun": {"elevation_deg": 1.0, "radius_deg": 0.26}}]}
    expected = {"samples": [{"sun": {"elevation_deg": 1.0}}]}
    differences = contract.diff_keys(actual, expected)
    assert differences == ["extra key: samples[0].sun.radius_deg"]


def test_nested_list_of_dicts_compared_via_first_element() -> None:
    actual = {"samples": [{"utc": "a", "sun": {"radius_deg": 1.0}}]}
    expected = {"samples": [{"utc": "b", "sun": {"radius_deg": 2.0}}]}
    assert contract.diff_keys(actual, expected) == []


def test_optional_extra_fields_may_be_missing_or_present() -> None:
    expected = [{"id": "a", "cards": [{"text": "x"}]}]
    assert contract.diff_keys([{"id": "b"}], expected) == []
    assert contract.diff_keys([{"id": "b", "cards": []}], [{"id": "a"}]) == []
    assert contract.diff_keys(
        [{"id": "b", "cards": [{"txt": "y"}]}], expected
    ) == ["missing key: [0].cards[0].text", "extra key: [0].cards[0].txt"]


def test_empty_list_on_either_side_passes() -> None:
    assert contract.diff_keys({"samples": []}, {"samples": [{"utc": "a"}]}) == []
    assert contract.diff_keys({"samples": [{"utc": "a"}]}, {"samples": []}) == []


def test_assert_matches_example_passes_for_example_shape() -> None:
    expected = contract.load_example("health")
    assert isinstance(expected, dict)
    contract.assert_matches_example(dict(expected), "health")


def test_assert_matches_example_reports_differences() -> None:
    expected = contract.load_example("health")
    assert isinstance(expected, dict)
    actual = dict(expected)
    actual.pop("ok")
    actual["unexpected"] = True
    with pytest.raises(AssertionError) as excinfo:
        contract.assert_matches_example(actual, "health")
    message = str(excinfo.value)
    assert "missing key: ok" in message
    assert "extra key: unexpected" in message


def test_load_example_prefers_data_examples_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    data_dir = tmp_path / "data-examples"
    fixtures_dir = tmp_path / "fixtures-examples"
    data_dir.mkdir()
    fixtures_dir.mkdir()
    (data_dir / "sample.json").write_text(json.dumps({"from": "data"}), encoding="utf-8")
    (fixtures_dir / "sample.json").write_text(
        json.dumps({"from": "fixtures"}), encoding="utf-8"
    )
    monkeypatch.setattr(contract, "EXAMPLES_DIR", data_dir)
    monkeypatch.setattr(contract, "FIXTURES_DIR", fixtures_dir)

    assert contract.load_example("sample") == {"from": "data"}


def test_load_example_falls_back_to_fixtures_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    data_dir = tmp_path / "data-examples"
    fixtures_dir = tmp_path / "fixtures-examples"
    data_dir.mkdir()
    fixtures_dir.mkdir()
    (fixtures_dir / "sample.json").write_text(
        json.dumps({"from": "fixtures"}), encoding="utf-8"
    )
    monkeypatch.setattr(contract, "EXAMPLES_DIR", data_dir)
    monkeypatch.setattr(contract, "FIXTURES_DIR", fixtures_dir)

    assert contract.load_example("sample") == {"from": "fixtures"}


def test_load_example_raises_when_missing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(contract, "EXAMPLES_DIR", tmp_path / "data-examples")
    monkeypatch.setattr(contract, "FIXTURES_DIR", tmp_path / "fixtures-examples")

    with pytest.raises(FileNotFoundError):
        contract.load_example("sample")
