"""Tests for app.core.visibility.visible_fraction."""

from __future__ import annotations

import math

import pytest

from app.core.visibility import visible_fraction


def _expected_fraction(x: float) -> float:
    """Closed-form circular-segment area fraction for a normalised offset x."""
    return (math.pi - math.acos(x) + x * math.sqrt(1.0 - x * x)) / math.pi


def test_center_on_horizon_is_half() -> None:
    assert visible_fraction(10.0, 10.0, 2.0) == pytest.approx(0.5)


def test_top_edge_on_horizon_is_fully_visible() -> None:
    # elevation = horizon + radius -> the whole disk is above the horizon line
    assert visible_fraction(12.0, 10.0, 2.0) == pytest.approx(1.0)


def test_bottom_edge_on_horizon_is_fully_hidden() -> None:
    # elevation = horizon - radius -> the whole disk is below the horizon line
    assert visible_fraction(8.0, 10.0, 2.0) == pytest.approx(0.0)


def test_far_above_horizon_is_one() -> None:
    assert visible_fraction(90.0, 0.0, 0.5) == pytest.approx(1.0)


def test_far_below_horizon_is_zero() -> None:
    assert visible_fraction(-90.0, 0.0, 0.5) == pytest.approx(0.0)


def test_monotonic_increasing_over_sweep() -> None:
    horizon = 5.0
    radius = 1.5
    previous = -1.0
    for step in range(-40, 41):
        elevation = horizon + step * 0.05
        value = visible_fraction(elevation, horizon, radius)
        assert value >= previous - 1e-12
        previous = value


def test_symmetry_around_horizon() -> None:
    horizon = 3.0
    radius = 2.0
    for step in range(0, 21):
        offset = step * 0.05
        above = visible_fraction(horizon + offset, horizon, radius)
        below = visible_fraction(horizon - offset, horizon, radius)
        assert above + below == pytest.approx(1.0)


def test_zero_radius_is_a_point_source() -> None:
    assert visible_fraction(10.0, 5.0, 0.0) == pytest.approx(1.0)
    assert visible_fraction(5.0, 5.0, 0.0) == pytest.approx(1.0)
    assert visible_fraction(4.0, 5.0, 0.0) == pytest.approx(0.0)


def test_half_offset_matches_closed_form() -> None:
    # x = (elevation - horizon) / radius = 0.5
    value = visible_fraction(11.0, 10.0, 2.0)
    assert value == pytest.approx(_expected_fraction(0.5))
