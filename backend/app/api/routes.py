from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from app.models.schemas import Point, SemanticSearchRequest, SemanticSearchResponse, SemanticSearchResult
from app.services.embedding import semantic_search

router = APIRouter()


@router.get("/points", response_model=list[Point])
def get_points(
    request: Request,
    limit: int | None = Query(default=None, ge=1, le=10500)
) -> list[Point]:
    startup_error = request.app.state.startup_error
    if startup_error:
        raise HTTPException(status_code=503, detail=f"Points not ready: {startup_error}")
    # points are precomputed at startup and stored in app.state
    points = request.app.state.points

    if limit is None:
        return points
    
    # if user requests more than we have, just return all
    return points[: min(limit, len(points))]


@router.post("/semantic-search", response_model=SemanticSearchResponse)
def post_semantic_search(
    payload: SemanticSearchRequest,
    request: Request,
) -> SemanticSearchResponse:
    startup_error = request.app.state.startup_error
    if startup_error:
        raise HTTPException(status_code=503, detail=f"Points not ready: {startup_error}")

    points = request.app.state.points
    model = request.app.state.model
    semantic_index = request.app.state.semantic_index

    if not points or model is None or semantic_index is None:
        raise HTTPException(status_code=503, detail="Semantic index not ready")

    results_raw = semantic_search(
        model=model,
        points=points,
        index=semantic_index,
        query=payload.query,
        top_k=payload.top_k,
        limit=payload.limit,
    )

    results = [
        SemanticSearchResult(point=Point(**item["point"]), score=item["score"])
        for item in results_raw
    ]

    total_candidates = len(points) if payload.limit is None else min(payload.limit, len(points))

    return SemanticSearchResponse(
        query=payload.query,
        top_k=payload.top_k,
        total_candidates=total_candidates,
        results=results,
    )

