from __future__ import annotations

from datetime import datetime, timezone
import os

import numpy as np

import hashlib
import json

from sentence_transformers import SentenceTransformer

from app.services.embedding import build_embeddings, build_points
from app.services.ingest.load_attractions_global import load_attractions_global
from app.services.ingest.load_otm_source_rows import load_otm_source_rows

from .contracts import DatasetMetadata, OrchestratorSettings, PreparedDataset, Rows
from .dataset_storage import DatasetStorage


def _compute_rows_fingerprint(rows: Rows) -> str:
    """
    Create a deterministic SHA-256 hash of normalized rows.

    If rows content changes, cached embeddings/points must be rebuilt.
    """
    payload = json.dumps(
        rows,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _fetch_rows_by_source(settings: OrchestratorSettings) -> Rows:
    """
    Dispatch rows loading to a source-specific ingestion strategy.

    Keeps source-specific logic isolated,
    while the rest of orchestrator pipeline stays source-independent.
    """
    if settings.dataset_source == "itinerai":
        return load_attractions_global(
            limit=settings.points_limit,
            use_cache=not settings.force_download,
            force_download=settings.force_download,
            seed=settings.seed,
        )

    if settings.dataset_source == "otm":
        return load_otm_source_rows(
            dataset_id=settings.dataset_id,
            limit=settings.points_limit,
            use_cache=not settings.force_download,
            force_download=settings.force_download,
            seed=settings.seed,
        )

    raise ValueError(f"Unsupported dataset_source: {settings.dataset_source}")


def _load_rows_phase(
    *,
    storage: DatasetStorage,
    settings: OrchestratorSettings,
) -> tuple[Rows, str, bool, DatasetMetadata | None]:
    """
    Rows phase:
    - reuse cached rows when available (unless force_download=True),
    - otherwise fetch rows via source-specific loader and save them,
    - always compute rows fingerprint for cache invalidation downstream.
    """
    previous_metadata = storage.read_metadata(settings.dataset_id)

    cached_rows = None if settings.force_download else storage.read_rows(settings.dataset_id)
    if cached_rows is not None:
        rows = cached_rows
        rows_rebuilt = False
    else:
        rows = _fetch_rows_by_source(settings)
        storage.save_rows(settings.dataset_id, rows)
        rows_rebuilt = True

    rows_fingerprint = _compute_rows_fingerprint(rows)
    return rows, rows_fingerprint, rows_rebuilt, previous_metadata


def _load_embeddings_phase(
    *,
    storage: DatasetStorage,
    model: SentenceTransformer,
    settings: OrchestratorSettings,
    rows: Rows,
    rows_fingerprint: str,
    rows_rebuilt: bool,
    previous_metadata: DatasetMetadata | None,
) -> tuple[np.ndarray, bool]:
    """
    Reuse cached embeddings only when:
    - rows were not rebuilt,
    - previous rows_fingerprint matches current rows_fingerprint,
    - previous model_name matches current model_name.

    Otherwise rebuild embeddings and persist them.
    """
    current_model_name = getattr(model, "model_name_or_path", type(model).__name__)

    can_use_cached_embeddings = (
        not rows_rebuilt
        and previous_metadata is not None
        and previous_metadata.get("rows_fingerprint") == rows_fingerprint
        and previous_metadata.get("model_name") == current_model_name
    )

    cached_embeddings = (
        storage.read_embeddings(settings.dataset_id) if can_use_cached_embeddings else None
    )

    if cached_embeddings is not None:
        return cached_embeddings, False

    embeddings = build_embeddings(
        model=model,
        rows=rows,
    )
    storage.save_embeddings(settings.dataset_id, embeddings)
    return embeddings, True


def _load_points_phase(
    *,
    storage: DatasetStorage,
    settings: OrchestratorSettings,
    rows: Rows,
    embeddings: np.ndarray,
    rows_fingerprint: str,
    rows_rebuilt: bool,
    embeddings_rebuilt: bool,
    previous_metadata: DatasetMetadata | None,
) -> tuple[list[dict[str, object]], bool]:
    """
    Load or rebuild 2D map points.

    Reuse cached points only when:
    - rows were not rebuilt,
    - embeddings were not rebuilt,
    - previous rows_fingerprint matches current rows_fingerprint,
    - previous seed/UMAP/KMeans settings match current settings.

    Otherwise rebuild points from rows + embeddings and persist to storage.
    """
    current_kmeans_clusters = int(os.getenv("KMEANS_CLUSTERS", 30))

    can_use_cached_points = (
        not rows_rebuilt
        and not embeddings_rebuilt
        and previous_metadata is not None
        and previous_metadata.get("rows_fingerprint") == rows_fingerprint
        and previous_metadata.get("seed") == settings.seed
        and previous_metadata.get("umap_n_neighbors") == settings.umap_n_neighbors
        and previous_metadata.get("umap_min_dist") == settings.umap_min_dist
        and previous_metadata.get("kmeans_clusters") == current_kmeans_clusters
    )

    cached_points = storage.read_points(settings.dataset_id) if can_use_cached_points else None
    if cached_points is not None:
        return cached_points, False

    points = build_points(
        rows=rows,
        embeddings=embeddings,
        seed=settings.seed,
        umap_n_neighbors=settings.umap_n_neighbors,
        umap_min_dist=settings.umap_min_dist,
    )
    storage.save_points(settings.dataset_id, points)
    return points, True


def _build_metadata(
    *,
    settings: OrchestratorSettings,
    model: SentenceTransformer,
    rows: Rows,
    points: list[dict[str, object]],
    embeddings: np.ndarray,
    rows_fingerprint: str,
) -> DatasetMetadata:
    """
    Build metadata describing how current artifacts were produced.

    Includes source identity, model/settings, artifact sizes, and
    rows_fingerprint used for cache invalidation on future runs.
    """
    # if embeddings is a non-empty 2D matrix, take number of columns (shape[1]) as embedding dimension,
    # otherwise use 0 to avoid index errors on empty/invalid shapes
    embedding_dim = int(embeddings.shape[1]) if embeddings.ndim == 2 and embeddings.shape[0] > 0 else 0

    return {
        "dataset_id": settings.dataset_id,
        "dataset_source": settings.dataset_source,
        "dataset_split": settings.dataset_split,
        "model_name": getattr(model, "model_name_or_path", type(model).__name__),
        "seed": settings.seed,
        "points_limit": settings.points_limit,
        "umap_n_neighbors": settings.umap_n_neighbors,
        "umap_min_dist": settings.umap_min_dist,
        "kmeans_clusters": int(os.getenv("KMEANS_CLUSTERS", 30)),
        "rows_count": len(rows),
        "points_count": len(points),
        "embedding_dim": embedding_dim,
        "rows_fingerprint": rows_fingerprint,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
    }


def load_prepared_dataset(
    *,
    storage: DatasetStorage,
    model: SentenceTransformer,
    settings: OrchestratorSettings,
) -> PreparedDataset:
    """
    Orchestrate dataset preparation pipeline with cache-aware stages:

    1) rows phase
    2) embeddings phase
    3) points phase
    4) metadata save

    Returns PreparedDataset with in-memory objects ready for app.state.
    """
    rows, rows_fingerprint, rows_rebuilt, previous_metadata = _load_rows_phase(
        storage=storage,
        settings=settings,
    )

    embeddings, embeddings_rebuilt = _load_embeddings_phase(
        storage=storage,
        model=model,
        settings=settings,
        rows=rows,
        rows_fingerprint=rows_fingerprint,
        rows_rebuilt=rows_rebuilt,
        previous_metadata=previous_metadata,
    )

    points, _ = _load_points_phase(
        storage=storage,
        settings=settings,
        rows=rows,
        embeddings=embeddings,
        rows_fingerprint=rows_fingerprint,
        rows_rebuilt=rows_rebuilt,
        embeddings_rebuilt=embeddings_rebuilt,
        previous_metadata=previous_metadata,
    )

    metadata = _build_metadata(
        settings=settings,
        model=model,
        rows=rows,
        points=points,
        embeddings=embeddings,
        rows_fingerprint=rows_fingerprint,
    )
    # Always refresh metadata so it reflects the exact artifacts currently on disk.
    storage.save_metadata(settings.dataset_id, metadata)

    return PreparedDataset(
        dataset_id=settings.dataset_id,
        rows=rows,
        embeddings=embeddings,
        points=points,
        metadata=metadata,
    )
