"""Request and response models for ``POST /api/compare`` (ADR-0003, "Senaryo ve karşılaştırma")."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, SerializerFunctionWrapHandler, model_serializer

from app.models.common import Validity
from app.models.events import Criterion, NowStatus


class Scenario(BaseModel):
    """A site (``site_id``) or custom coordinates (``lat_deg`` and ``lon_deg``) over a date range."""

    scenario_id: str
    label: str
    site_id: str | None = None
    lat_deg: float | None = None
    lon_deg: float | None = None
    start_utc: str
    end_utc: str
    mast_height_m: float | None = None
    panel_profile_id: str
    fixed_azimuth_deg: float | None = None
    earth_criterion: Criterion | None = None

    @model_serializer(mode="wrap")
    def _drop_unset_azimuth(self, handler: SerializerFunctionWrapHandler) -> dict[str, Any]:
        """``fixed_azimuth_deg`` is optional in the contract; leave it out when it is not set."""

        data = handler(self)
        if data.get("fixed_azimuth_deg") is None:
            data.pop("fixed_azimuth_deg", None)
        return data


class CompareRequest(BaseModel):
    """Body of ``POST /api/compare``."""

    scenarios: list[Scenario]


class CompareMetrics(BaseModel):
    """The six compared metrics."""

    sunlit_fraction: float | None
    longest_dark_hours: float | None
    max_sun_elevation_deg: float | None
    earth_visible_fraction: float | None
    longest_earth_hidden_hours: float | None
    mean_power_w: float | None


class CompareScenarioResult(BaseModel):
    """One scenario's results; ``scenario`` echoes the request with the mast height and criterion used."""

    scenario: Scenario
    metrics: CompareMetrics
    now: NowStatus | None
    validity: Validity


class CompareDelta(BaseModel):
    """One metric across scenarios; ``values`` is keyed by ``scenario_id``."""

    metric: str
    values: dict[str, float | None]
    unit: str
    best_scenario_id: str | None


class CompareResponse(BaseModel):
    """``POST /api/compare``."""

    scenarios: list[CompareScenarioResult]
    deltas: list[CompareDelta]
