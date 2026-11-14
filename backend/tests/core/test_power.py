"""Panel power model: T3 reference values and panel geometry."""

from __future__ import annotations

from datetime import datetime, timezone

import numpy as np
import pytest

from app.core.events import Observer
from app.core.power import compute_power, disk_fraction, incidence_cos
from app.terrain.horizon import HorizonProfile

MONS_MOUTON = (-84.78, 29.13)
APOLLO_11 = (0.67416, 23.47314)
START = datetime(2026, 12, 1, tzinfo=timezone.utc)
END = datetime(2027, 1, 1, tzinfo=timezone.utc)
T3_SUN_RADIUS_DEG = 0.267

# Mean power per square metre, no efficiency (guc-degerlendirmesi.md, "Test verisi").
T3_MEAN_POWER = {
    "two_axis": {-1.0: 892.7, 0.0: 771.2, 1.0: 688.3},
    "vertical_tracking": {-1.0: 890.3, 0.0: 768.8, 1.0: 685.9},
    "vertical_fixed": {-1.0: 426.2, 0.0: 423.4, 1.0: 423.3},
    "horizontal": {-1.0: 54.3, 0.0: 54.3, 1.0: 53.6},
}
T3_LONGEST_DARK_HOURS = {-1.0: 232.0, 0.0: 280.0}


def _observer(horizon_deg: float, validity: str = "SYNTHETIC", method: str = "sphere") -> Observer:
    lat, lon = MONS_MOUTON
    profile = HorizonProfile(lat, lon, None, 0.0, [horizon_deg] * 720, method, validity=validity)
    return Observer(lat, lon, 0.0, profile)


def _panel(panel_type: str, validity: str = "SYNTHETIC", **extra: object) -> dict:
    return {"id": panel_type, "type": panel_type, "area_m2": 1.0, "efficiency": 1.0, "validity": validity, **extra}


def _t3(panel_type: str, horizon_deg: float, disk_model: str = "vertical") -> dict:
    return compute_power(
        _observer(horizon_deg), START, END, _panel(panel_type),
        disk_model=disk_model, sun_radius_deg=T3_SUN_RADIUS_DEG,
    )


@pytest.mark.parametrize("horizon_deg", [-1.0, 0.0, 1.0])
@pytest.mark.parametrize("panel_type", list(T3_MEAN_POWER))
def test_t3_mean_power(panel_type: str, horizon_deg: float) -> None:
    result = _t3(panel_type, horizon_deg)

    assert len(result["samples"]) == 745
    expected = T3_MEAN_POWER[panel_type][horizon_deg]
    assert result["summary"]["mean_power_w"] == pytest.approx(expected, rel=0.005)


@pytest.mark.parametrize("horizon_deg", list(T3_LONGEST_DARK_HOURS))
def test_t3_longest_dark(horizon_deg: float) -> None:
    result = _t3("vertical_tracking", horizon_deg)

    assert result["summary"]["longest_dark_hours"] == pytest.approx(T3_LONGEST_DARK_HOURS[horizon_deg], abs=1.0)


def test_area_and_vertical_disk_models_differ_little() -> None:
    """The product uses the area fraction; the T3 table used the vertical fraction (reported in the PR)."""

    vertical = _t3("vertical_tracking", 0.0)["summary"]["mean_power_w"]
    area = _t3("vertical_tracking", 0.0, disk_model="area")["summary"]["mean_power_w"]
    assert area == pytest.approx(vertical, rel=0.001)


def test_best_fixed_direction_is_reported() -> None:
    result = _t3("vertical_fixed", 0.0)

    assert result["fixed_azimuth_deg"] is not None
    assert 0.0 <= result["fixed_azimuth_deg"] < 360.0
    other = compute_power(
        _observer(0.0), START, END, _panel("vertical_fixed"),
        fixed_azimuth_deg=(result["fixed_azimuth_deg"] + 90.0) % 360.0,
        disk_model="vertical", sun_radius_deg=T3_SUN_RADIUS_DEG,
    )
    assert other["summary"]["mean_power_w"] < result["summary"]["mean_power_w"]


def test_fixed_panel_facing_west_gets_nothing_from_an_eastern_sun() -> None:
    result = compute_power(_observer(-1.0), START, END, _panel("vertical_fixed"), fixed_azimuth_deg=270.0)

    assert result["fixed_azimuth_deg"] == 270.0
    from app.core import ephemeris

    times = [s["utc"] for s in result["samples"]]
    sun = ephemeris.body_positions(*MONS_MOUTON, 0.0, times, "SUN")
    east = [i for i, p in enumerate(sun) if 0.0 < p.azimuth_true_deg < 180.0]
    assert east
    assert all(result["samples"][i]["power_w"] == 0.0 for i in east)


def test_other_panels_ignore_fixed_azimuth() -> None:
    result = compute_power(_observer(0.0), START, END, _panel("vertical_tracking"), fixed_azimuth_deg=90.0)

    assert result["fixed_azimuth_deg"] is None


def test_validity_is_the_lower_of_panel_and_horizon() -> None:
    terrain = compute_power(_observer(0.0, "DERIVED", "terrain"), START, END, _panel("two_axis", "MODEL"))
    flat = compute_power(_observer(0.0), START, END, _panel("two_axis", "MEASURED"))

    assert terrain["validity"] == "DERIVED"
    assert flat["validity"] == "SYNTHETIC"


def test_efficiency_and_area_scale_power() -> None:
    base = compute_power(_observer(0.0), START, END, _panel("two_axis"))
    scaled = compute_power(_observer(0.0), START, END, _panel("two_axis", area_m2=2.0, efficiency=0.27))

    assert scaled["summary"]["mean_power_w"] == pytest.approx(base["summary"]["mean_power_w"] * 0.54)
    assert scaled["summary"]["energy_kwh"] == pytest.approx(scaled["summary"]["mean_power_w"] * 744 / 1000)


def test_incidence_per_panel_type() -> None:
    az = np.array([90.0])
    el = np.array([30.0])

    assert incidence_cos("two_axis", az, el)[0] == pytest.approx(1.0)
    assert incidence_cos("vertical_tracking", az, el)[0] == pytest.approx(np.cos(np.radians(30)))
    assert incidence_cos("horizontal", az, el)[0] == pytest.approx(0.5)
    assert incidence_cos("vertical_fixed", az, el, 90.0)[0] == pytest.approx(np.cos(np.radians(30)))
    assert incidence_cos("vertical_fixed", az, el, 270.0)[0] == 0.0


def test_disk_fraction_models_agree_at_the_edges() -> None:
    el = np.array([-1.0, 0.0, 1.0])
    horizon = np.zeros(3)
    radius = np.full(3, 0.267)
    for model in ("area", "vertical"):
        assert disk_fraction(el, horizon, radius, model).tolist() == pytest.approx([0.0, 0.5, 1.0])


def test_eclipse_lowers_power_at_apollo_11() -> None:
    """S-09: Earth covers part of the Sun on 20 and 21 February 2027 (T5)."""

    lat, lon = APOLLO_11
    observer = Observer(lat, lon, 0.0, HorizonProfile(lat, lon, None, 0.0, [0.0] * 720, "sphere"))
    start = datetime(2027, 2, 20, 20, tzinfo=timezone.utc)
    end = datetime(2027, 2, 21, 2, tzinfo=timezone.utc)
    samples = {s["utc"]: s for s in compute_power(observer, start, end, _panel("two_axis"))["samples"]}

    before = samples[datetime(2027, 2, 20, 21, tzinfo=timezone.utc)]
    during = samples[datetime(2027, 2, 21, 0, tzinfo=timezone.utc)]
    after = samples[datetime(2027, 2, 21, 2, tzinfo=timezone.utc)]
    assert before["sun_visible_fraction"] > 0.99
    assert after["sun_visible_fraction"] > 0.99
    assert during["sun_visible_fraction"] < 0.9
    assert during["power_w"] < before["power_w"]
