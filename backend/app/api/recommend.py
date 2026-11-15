"""``POST /api/recommend``: rank the candidate regions of a map region (#97, 4.4).

The score ranks the sites for the user's weights; it does not certify a
landing site (docs/design/saha-puani.md).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core import recommend
from app.models.recommend import RecommendRequest, RecommendResponse

router = APIRouter(tags=["terrain"])


@router.post("/recommend", response_model=RecommendResponse)
def post_recommend(request: RecommendRequest) -> RecommendResponse:
    """Score every candidate region (and catalogue site) over the period and rank them."""

    return RecommendResponse(**recommend.recommend(request.model_dump()))
