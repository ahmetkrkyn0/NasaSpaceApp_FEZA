"""``POST /api/compare``: compare two to four scenarios."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.events import metrics_payload
from app.api.now import now_payload
from app.core import compare, params
from app.models.compare import CompareRequest, CompareResponse

router = APIRouter(tags=["compare"])


@router.post("/compare", response_model=CompareResponse)
def post_compare(request: CompareRequest) -> CompareResponse:
    """Six metrics per scenario, the best scenario for each, and each scenario's state at its start."""

    result = compare.compare([s.model_dump() for s in request.scenarios])
    scenarios = []
    for item in result["scenarios"]:
        metrics = metrics_payload(item["metrics"])
        metrics["mean_power_w"] = params.rounded(item["metrics"]["mean_power_w"], 2)
        scenarios.append({
            "scenario": item["scenario"],
            "metrics": metrics,
            "now": now_payload(item["now"], item["now"]["mast_height_m"]),
            "validity": item["validity"],
        })
    deltas = [
        {
            **delta,
            "values": {sid: params.rounded(v, 4) for sid, v in delta["values"].items()},
        }
        for delta in result["deltas"]
    ]
    return CompareResponse(scenarios=scenarios, deltas=deltas)
