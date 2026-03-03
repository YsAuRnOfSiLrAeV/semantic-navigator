from __future__ import annotations
import os

import uuid

from sklearn.cluster import KMeans

from typing import Any

from sentence_transformers import SentenceTransformer
from umap import UMAP

from app.services.ingest import load_attractions


def to_csv(v):
    if isinstance(v, list):
        return ", ".join(str(x) for x in v)
    return str(v or "")


def to_text(v):
    return "" if v is None else str(v)


def build_points(
    *,  # keyword-only arguments not to mess with positional arguments
    model: SentenceTransformer,
    limit: int = 10500,
    use_cache: bool = True,
    force_download: bool = False,
    seed: int = 42,
    umap_n_neighbors: int = 10,
    umap_min_dist: float = 0.5,
) -> list[dict[str, Any]]:
    """
    Loads attractions rows via load_attractions(), embeds headlines, reduces to 2D with UMAP,
    and returns points with x/y coordinates for the frontend.
    """
    rows = load_attractions(limit=limit, use_cache=use_cache, force_download=force_download, seed=seed)
    if not rows:
        return []

    texts = [
        ("Name: " + to_text(r.get("name", "")) + ".\n" +
        "Description: " + to_text(r.get("description", "")) + ".\n" +
        "Categories: " + to_csv(r.get("categories", "")) + ".\n" +
        "Review tags: : " + to_csv(r.get("review_tags", "")) + ".\n" +
        "Destination: " + to_text(r.get("destination", "")) + ".\n" +
        "Rating: " + to_text(r.get("rating", ""))
        ).strip()
        for r in rows
    ]

    # takes a list of headlines and short descriptions, returns a matrix of embeddings
    embeddings = model.encode(
        texts,
        show_progress_bar=True,
        normalize_embeddings=True, # normalizes embeddings to unit length, good for cosine metric
    )

    k = int(os.getenv("KMEANS_CLUSTERS", 30))
    k = min(k, len(rows))  # in case there are less points than clusters

    kmeans = KMeans(n_clusters=k, random_state=seed, n_init="auto")
    # array, where indexes are points, values are clusters
    cluster_labels = kmeans.fit_predict(embeddings)

    reducer = UMAP(
        n_components=2,
        n_neighbors=umap_n_neighbors,
        min_dist=umap_min_dist,
        # cosine metric to measure angle between vectors
        metric="cosine", 
        random_state=seed,  # reproducible layout
    )
    coords = reducer.fit_transform(embeddings)

    points: list[dict[str, Any]] = []
    for i, row in enumerate(rows):
        raw_id = row.get("tripadvisor_url") or row.get("attraction_url") or f"{row.get('name','')}|{row.get('destination','')}|{i}"
        doc_id = str(uuid.uuid5(uuid.NAMESPACE_URL, raw_id))
        points.append(
            {
                "id": doc_id,
                "x": float(coords[i, 0]),
                "y": float(coords[i, 1]),
                "cluster": int(cluster_labels[i]),
                "name": row.get("name", ""),
                "description": row.get("description", ""),
                "categories": row.get("categories", ""),
                "review_tags": row.get("review_tags", ""),
                "destination": row.get("destination", ""),
                "rating": row.get("rating", ""),
                "attraction_url": row.get("attraction_url", ""),
                "tripadvisor_url": row.get("tripadvisor_url", ""),
                "picture": row.get("picture", ""),
            }
        )

    return points