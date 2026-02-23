from __future__ import annotations
import os

from sklearn.cluster import KMeans

from typing import Any

from sentence_transformers import SentenceTransformer
from umap import UMAP

from app.services.ingest import load_news


def build_points(
    *,  # keyword-only arguments not to mess with positional arguments
    model: SentenceTransformer,
    limit: int = 5000,
    use_cache: bool = True,
    force_download: bool = False,
    seed: int = 42,
    umap_n_neighbors: int = 10,
    umap_min_dist: float = 0.5,
) -> list[dict[str, Any]]:
    """
    Loads news rows via load_news(), embeds headlines, reduces to 2D with UMAP,
    and returns points with x/y coordinates for the frontend.
    """
    rows = load_news(limit=limit, use_cache=use_cache, force_download=force_download, seed=seed)
    if not rows:
        return []

    texts = [
        (r.get("headline", "") + ". " + r.get("short_description", "")).strip()
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
        doc_id = row.get("link") or str(i) # stable id with link, fallback to index
        points.append(
            {
                "id": doc_id,
                "x": float(coords[i, 0]),
                "y": float(coords[i, 1]),
                "cluster": int(cluster_labels[i]),
                "headline": row.get("headline", ""),
                "short_description": row.get("short_description", ""),
                "link": row.get("link", ""),
                "category": row.get("category", ""),
            }
        )

    return points