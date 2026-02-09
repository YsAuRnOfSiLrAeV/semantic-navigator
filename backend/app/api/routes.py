from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from app.models.schemas import Point

router = APIRouter()


@router.get("/points", response_model=list[Point])
def get_points(
    request: Request,
    limit: int | None = Query(default=None, ge=1, le=5000)
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
