from __future__ import annotations

from pydantic import BaseModel


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
