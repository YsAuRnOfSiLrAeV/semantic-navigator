from __future__ import annotations
import os

import uuid

from sklearn.cluster import KMeans

from typing import Any

from sentence_transformers import SentenceTransformer
from umap import UMAP

import numpy as np


def _to_csv(v):
    if isinstance(v, list):
        return ", ".join(str(x) for x in v)
    return str(v or "")


def _to_text(v):
    return "" if v is None else str(v)


def build_embeddings(
    *,
    model: SentenceTransformer,
    rows: list[dict[str, Any]],
) -> np.ndarray:
    """
    Build normalized float32 embeddings matrix from attraction rows.
    """

    if not rows:
        return np.empty((0, 0), dtype=np.float32)

    texts = [
        (
            "Name: " + _to_text(r.get("name", "")) + ".\n"
            "Description: " + _to_text(r.get("description", "")) + ".\n"
            "Categories: " + _to_csv(r.get("categories", "")) + ".\n"
            "Review tags: " + _to_csv(r.get("review_tags", "")) + ".\n"
            "Destination: " + _to_text(r.get("destination", "")) + ".\n"
            "Rating: " + _to_text(r.get("rating", ""))
        ).strip()
        for r in rows
    ]

    return np.asarray(
        model.encode(
            texts,
            show_progress_bar=True,
            normalize_embeddings=True,
        ),
        dtype=np.float32,
    )


def build_points(
    *,  # keyword-only arguments not to mess with positional arguments
    rows: list[dict[str, Any]],
    embeddings: np.ndarray,
    seed: int = 42,
    umap_n_neighbors: int = 10,
    umap_min_dist: float = 0.5,
) -> list[dict[str, Any]]:
    """
    Build 2D clustered map points from rows and precomputed embeddings.
    """

    if not rows or embeddings.size == 0:
        return []

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
        raw_id = (
            row.get("tripadvisor_url")
            or row.get("source_url")
            or f"{row.get('name', '')}|{row.get('destination', '')}|{i}"
        )
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
                "source_url": row.get("source_url"),
                "tripadvisor_url": row.get("tripadvisor_url", ""),
                "picture": row.get("picture", ""),
            }
        )

    return points


def semantic_search(
    *,
    model: SentenceTransformer,
    points: list[dict[str, Any]],
    embeddings: np.ndarray,
    query: str,
    top_k: int = 30,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    """
    Return top-k nearest points by cosine similarity using precomputed embeddings.
    """

    if embeddings.size == 0 or len(points) == 0:
        return []

    n = len(points) if limit is None else min(limit, len(points))
    if n <= 0:
        return []

    query_vec = model.encode([query], normalize_embeddings=True)
    query_vec = np.asarray(query_vec, dtype=np.float32)[0]

    # The dot product of each matrix vector with the Query vector. 
    # Returns array of similarity scores by cosine 
    similarity_scores = embeddings[:n] @ query_vec 

    k = min(top_k, n)
    if k <= 0:
        return []

    top_idx_unsorted = np.argpartition(-similarity_scores, k - 1)[:k]
    top_idx = top_idx_unsorted[np.argsort(-similarity_scores[top_idx_unsorted])]

    out: list[dict[str, Any]] = []
    for i in top_idx.tolist():
        out.append(
            {
                "point": points[i],
                "score": float(similarity_scores[i]),
            }
        )
    return out