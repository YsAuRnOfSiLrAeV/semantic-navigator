from __future__ import annotations

from pydantic import BaseModel


class Point(BaseModel):
    id: str
    x: float
    y: float
    cluster: int
    headline: str
    short_description: str
    link: str
    category: str