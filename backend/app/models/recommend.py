"""Request and response models for ``POST /api/recommend`` (#97, 4.4; ADR-0003, "Saha önerisi")."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.models.common import Validity

RecommendMetric = Literal[
    "sunlit_fraction",
    "longest_dark_hours",
    "earth_visible_fraction",
    "mean_slope_deg",
    "slope_std_deg",
    "distance_to_psr_km",
]


class RecommendWeights(BaseModel):
    """User weights, each 0 to 1; at least one above 0."""

    sunlit: float
    dark: float
    earth: float
    slope: float
    roughness: float
    psr_distance: float


class RecommendLimits(BaseModel):
    """Elimination limits; ``max_slope_deg`` is compared with the steepest slope in a site's window."""

    max_slope_deg: float = 12.0


class RecommendRequest(BaseModel):
    """Body of ``POST /api/recommend``."""

    region: str = "mons-mouton"
    start_utc: str
    end_utc: str
    mast_height_m: float | None = None
    weights: RecommendWeights
    limits: RecommendLimits = Field(default_factory=RecommendLimits)
    psr_preference: Literal["near", "far"] = "far"
    include_catalogue_sites: bool = True


class ScoreComponent(BaseModel):
    """One measure of a site: raw value, its 0..1 scale (1 best), weight and label."""

    metric: RecommendMetric
    value: float | None
    unit: str
    normalized: float | None
    weight: float
    validity: Validity


class RankedSite(BaseModel):
    """A candidate region or catalogue site; ``score`` is ``None`` when eliminated."""

    site_id: str
    name: str
    lat_deg: float
    lon_deg: float
    score: float | None
    eliminated: bool
    eliminated_by: list[str]
    components: list[ScoreComponent]
    validity: Validity


class RecommendResponse(BaseModel):
    """``POST /api/recommend``: scored sites first (highest score first), then eliminated ones."""

    ranked: list[RankedSite]
    weights: RecommendWeights
    limits: RecommendLimits
    assumptions: list[str]
    validity: Validity
