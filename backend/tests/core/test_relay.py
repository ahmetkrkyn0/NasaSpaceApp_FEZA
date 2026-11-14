"""Relay label rules (role-etiketi.md, section 4)."""

from __future__ import annotations

import pytest

from app.core.relay import RELAY_MIN_HOURS, relay_required, relay_status


def test_hidden_earth_over_a_month_requires_a_relay() -> None:
    assert relay_status(0.0, 365 * 24) == "required"
    assert relay_status(0.0, RELAY_MIN_HOURS) == "required"


def test_hidden_earth_over_a_short_range_is_unknown() -> None:
    assert relay_status(0.0, 708.6) == "unknown"
    assert relay_status(0.0, 96) == "unknown"


@pytest.mark.parametrize("hours", [24.0, 720.0, 8760.0])
def test_partly_visible_earth_is_intermittent(hours: float) -> None:
    assert relay_status(0.5, hours) == "intermittent"


def test_always_visible_earth_needs_no_relay() -> None:
    assert relay_status(1.0, 24.0) == "not_required"


def test_missing_fraction_is_unknown() -> None:
    assert relay_status(None, 8760.0) == "unknown"


@pytest.mark.parametrize(
    "status, expected",
    [("required", True), ("intermittent", False), ("not_required", False), ("unknown", False)],
)
def test_relay_required_follows_the_status(status: str, expected: bool) -> None:
    assert relay_required(status) is expected
