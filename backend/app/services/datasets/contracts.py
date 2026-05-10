from __future__ import annotations

from dataclasses import dataclass
from typing import Any, TypedDict

import numpy as np


Row = dict[str, Any]
Point = dict[str, Any]
Rows = list[Row]
Points = list[Point]


ARTIFACT_ROWS = "rows.json"
ARTIFACT_EMBEDDINGS = "embeddings.npy"
ARTIFACT_POINTS = "points.json"
ARTIFACT_METADATA = "metadata.json"


class DatasetMetadata(TypedDict):
    dataset_id: str
    dataset_source: str
    dataset_split: str
    model_name: str
    seed: int
    points_limit: int
    umap_n_neighbors: int
    umap_min_dist: float
    kmeans_clusters: int
    rows_count: int
    points_count: int
    embedding_dim: int
    rows_fingerprint: str
    created_at_utc: str


@dataclass(slots=True)
class PreparedDataset:
    dataset_id: str
    rows: Rows
    embeddings: np.ndarray
    points: Points
    metadata: DatasetMetadata


@dataclass(slots=True)
class BuildStatus:
    rows_rebuilt: bool
    embeddings_rebuilt: bool
    points_rebuilt: bool


@dataclass(slots=True)
class OrchestratorSettings:
    dataset_id: str
    dataset_source: str
    dataset_split: str
    points_limit: int
    seed: int
    umap_n_neighbors: int
    umap_min_dist: float
    force_download: bool = False

