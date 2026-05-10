from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from app.models.schemas import Point, SemanticSearchRequest, SemanticSearchResponse, SemanticSearchResult
from app.services.embedding import semantic_search

router = APIRouter()


def _resolve_prepared_dataset(request: Request, dataset_id: str | None):
    startup_error = request.app.state.startup_error
    if startup_error:
        raise HTTPException(status_code=503, detail=f"Datasets not ready: {startup_error}")

    datasets = getattr(request.app.state, "datasets", None)
    if not isinstance(datasets, dict) or not datasets:
        raise HTTPException(status_code=503, detail="Datasets cache is empty")

    selected_dataset_id = dataset_id or request.app.state.default_dataset_id
    prepared = datasets.get(selected_dataset_id)
    if prepared is None:
        available = ", ".join(sorted(datasets.keys()))
        raise HTTPException(
            status_code=400,
            detail=f"Unknown dataset_id: {selected_dataset_id}. Available: {available}",
        )

    return prepared


@router.get("/points", response_model=list[Point])
def get_points(
    request: Request,
    dataset_id: str | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1, le=10500),
) -> list[Point]:
    prepared = _resolve_prepared_dataset(request, dataset_id)
    points = prepared.points

    if limit is None:
        return points

    return points[: min(limit, len(points))]


@router.post("/semantic-search", response_model=SemanticSearchResponse)
def post_semantic_search(
    payload: SemanticSearchRequest,
    request: Request,
    dataset_id: str | None = Query(default=None),
) -> SemanticSearchResponse:
    prepared = _resolve_prepared_dataset(request, dataset_id)

    points = prepared.points
    embeddings = prepared.embeddings
    model = request.app.state.model

    if not points or model is None or embeddings is None:
        raise HTTPException(status_code=503, detail="Semantic search data not ready")

    results_raw = semantic_search(
        model=model,
        points=points,
        embeddings=embeddings,
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


