from __future__ import annotations

from pydantic import BaseModel, Field


class Point(BaseModel):
    id: str
    x: float
    y: float
    cluster: int
    name: str
    description: str
    categories: list[str] | str
    review_tags: list[str] | str
    destination: str
    rating: float | str
    attraction_url: str
    tripadvisor_url: str
    picture: str


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000)
    top_k: int = Field(default=30, ge=1, le=10500)
    limit: int | None = Field(default=None, ge=1, le=10500)


class SemanticSearchResult(BaseModel):
    point: Point
    score: float


class SemanticSearchResponse(BaseModel):
    query: str
    top_k: int
    total_candidates: int
    results: list[SemanticSearchResult]