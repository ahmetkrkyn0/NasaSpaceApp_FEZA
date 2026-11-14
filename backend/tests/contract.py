"""Contract helpers: compare API responses against the example fixtures.

The examples live in ``<repo>/data/examples`` when the team ships them there;
otherwise the copies under ``backend/tests/fixtures/examples`` are used.
Only key sets are compared, recursively; scalar values are not checked.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.settings import REPO_ROOT

EXAMPLES_DIR: Path = REPO_ROOT / "data" / "examples"
FIXTURES_DIR: Path = Path(__file__).resolve().parent / "fixtures" / "examples"

# Optional extra fields from ADR-0003 ("Ekstra özelliklerin ek alanları"). A record
# may carry them or not, so their presence or absence is not a contract difference.
OPTIONAL_KEYS: frozenset[str] = frozenset(
    {"cards", "relay_status", "relay_required", "max_obscured_fraction"}
)


def load_example(name: str) -> object:
    """Load the example JSON called ``name`` (without the ``.json`` suffix)."""
    for directory in (EXAMPLES_DIR, FIXTURES_DIR):
        path = directory / f"{name}.json"
        if path.is_file():
            with path.open(encoding="utf-8") as handle:
                return json.load(handle)
    raise FileNotFoundError(
        f"Example '{name}.json' not found in {EXAMPLES_DIR} or {FIXTURES_DIR}."
    )


def _join(path: str, key: str) -> str:
    return f"{path}.{key}" if path else key


def diff_keys(actual: object, expected: object, path: str = "") -> list[str]:
    """Return the key-set differences between ``actual`` and ``expected``.

    Dicts must have equal key sets, except for ``OPTIONAL_KEYS``; lists are
    compared through their first element when both sides are non-empty;
    scalars are not compared.
    """
    differences: list[str] = []
    if isinstance(expected, dict) and isinstance(actual, dict):
        for key in expected:
            if key not in actual:
                if key not in OPTIONAL_KEYS:
                    differences.append(f"missing key: {_join(path, key)}")
            else:
                differences.extend(
                    diff_keys(actual[key], expected[key], _join(path, key))
                )
        for key in actual:
            if key not in expected and key not in OPTIONAL_KEYS:
                differences.append(f"extra key: {_join(path, key)}")
    elif isinstance(expected, list) and isinstance(actual, list):
        if expected and actual:
            differences.extend(diff_keys(actual[0], expected[0], f"{path}[0]"))
    return differences


def assert_matches_example(actual: object, name: str) -> None:
    """Assert that ``actual`` has the same key structure as example ``name``."""
    expected = load_example(name)
    differences = diff_keys(actual, expected)
    if differences:
        joined = "\n".join(f"  - {difference}" for difference in differences)
        raise AssertionError(
            f"Response does not match example '{name}':\n{joined}"
        )
