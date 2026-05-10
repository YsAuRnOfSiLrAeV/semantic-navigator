from __future__ import annotations
from pathlib import Path
import json
import os
from typing import Any
import numpy as np

from .contracts import (
    ARTIFACT_EMBEDDINGS,
    ARTIFACT_METADATA,
    ARTIFACT_POINTS,
    ARTIFACT_ROWS,
    DatasetMetadata,
)


class DatasetStorage:
    """
    Filesystem storage for prepared dataset artifacts.

    datasets_root/
      dataset_id/
        rows.json
        embeddings.npy
        points.json
        metadata.json
    """

    def __init__(self, datasets_root: Path) -> None:
        self.datasets_root = datasets_root
        self.datasets_root.mkdir(parents=True, exist_ok=True)

    def dataset_dir(self, dataset_id: str) -> Path:
        self._validate_dataset_id(dataset_id)
        return self.datasets_root / dataset_id

    def artifact_path(self, dataset_id: str, artifact_name: str) -> Path:
        self._validate_artifact_name(artifact_name)
        return self.dataset_dir(dataset_id) / artifact_name
        
    def artifact_exists(self, dataset_id: str, artifact_name: str) -> bool:
        return self.artifact_path(dataset_id, artifact_name).exists()
    
    # ---------- Rows ----------
    def read_rows(self, dataset_id: str) -> list[dict[str, Any]] | None:
        if not self.artifact_exists(dataset_id, ARTIFACT_ROWS):
            return None
        path = self.artifact_path(dataset_id, ARTIFACT_ROWS)

        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def save_rows(self, dataset_id: str, rows: list[dict[str, Any]]) -> Path:
        path = self.artifact_path(dataset_id, ARTIFACT_ROWS)
        self._atomic_write_json(path, rows)
        return path
    
    # ---------- Embeddings ----------
    def read_embeddings(self, dataset_id: str) -> np.ndarray | None:
        if not self.artifact_exists(dataset_id, ARTIFACT_EMBEDDINGS):
            return None
        path = self.artifact_path(dataset_id, ARTIFACT_EMBEDDINGS)

        with path.open("rb") as f:
            arr = np.load(f, allow_pickle=False)

        return np.asarray(arr, dtype=np.float32)

    def save_embeddings(self, dataset_id: str, embeddings: np.ndarray) -> Path:
        path = self.artifact_path(dataset_id, ARTIFACT_EMBEDDINGS)
        arr = np.asarray(embeddings, dtype=np.float32)
        self._atomic_write_npy(path, arr)
        return path
    
    # ---------- Points ----------
    def read_points(self, dataset_id: str) -> list[dict[str, Any]] | None:
        if not self.artifact_exists(dataset_id, ARTIFACT_POINTS):
            return None
        path = self.artifact_path(dataset_id, ARTIFACT_POINTS)

        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def save_points(self, dataset_id: str, points: list[dict[str, Any]]) -> Path:
        path = self.artifact_path(dataset_id, ARTIFACT_POINTS)
        self._atomic_write_json(path, points)
        return path
    
    # ---------- Metadata ----------
    def read_metadata(self, dataset_id: str) -> DatasetMetadata | None:
        if not self.artifact_exists(dataset_id, ARTIFACT_METADATA):
            return None
        path = self.artifact_path(dataset_id, ARTIFACT_METADATA)

        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def save_metadata(self, dataset_id: str, metadata: DatasetMetadata) -> Path:
        path = self.artifact_path(dataset_id, ARTIFACT_METADATA)
        self._atomic_write_json(path, metadata)
        return path

    # ---------- Utils ----------
    def _validate_dataset_id(self, dataset_id: str) -> None:
        # dataset_id is a logical folder key, so it must not contain path traversal chars.
        if not dataset_id:
            raise ValueError("dataset_id must be non-empty")
        if ".." in dataset_id or "/" in dataset_id or "\\" in dataset_id or ":" in dataset_id:
            raise ValueError(f"Invalid dataset_id: {dataset_id}")

    def _validate_artifact_name(self, artifact_name: str) -> None:
        allowed = {
            ARTIFACT_ROWS,
            ARTIFACT_EMBEDDINGS,
            ARTIFACT_POINTS,
            ARTIFACT_METADATA,
        }
        if artifact_name not in allowed:
            raise ValueError(f"Unknown artifact name: {artifact_name}")

    def _atomic_write_json(self, path: Path, payload: Any) -> None:
        """
        Write to temp file first, then replace target file.
        Prevents broken JSON if process stops mid-write.
        """
        path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = path.with_suffix(path.suffix + ".tmp")

        with temp_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
            f.flush()
            os.fsync(f.fileno())

        os.replace(temp_path, path)

    def _atomic_write_npy(self, path: Path, payload: np.ndarray) -> None:
        """
        Temp file first, then replace target.
        """
        path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = path.with_suffix(path.suffix + ".tmp")

        with temp_path.open("wb") as f:
            np.save(f, payload)
            f.flush()
            os.fsync(f.fileno())

        os.replace(temp_path, path)

