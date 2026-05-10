from __future__ import annotations
from typing import TypedDict

class CanonicalRow(TypedDict):
    name: str
    description: str
    categories: list[str]
    review_tags: list[str]
    destination: str
    rating: float | str
    source_url: str
    tripadvisor_url: str
    picture: str

CanonicalRows = list[CanonicalRow]
