from __future__ import annotations

import json
from pathlib import Path

from app.services.ingest.source_file_map import SOURCE_FILE_MAP
from generate_datasets.write_otm_dataset import write_otm_dataset

# OTM datasets that we can generate via write_otm_dataset flow
OTM_KINDS_BY_DATASET: dict[str, str] = {
    "sport_global": "sport",
    "museums_global": "museums",
}


def _read_rows(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as file_handle:
        payload = json.load(file_handle)
    if not isinstance(payload, list):
        raise ValueError(f"Expected list JSON in {path}, got {type(payload).__name__}")
    return payload


def load_otm_source_rows(
    *,
    dataset_id: str,
    limit: int | None,
    use_cache: bool,
    force_download: bool,
    seed: int,
    oversample_factor: float = 6.0,
    rate: str = "3",
) -> list[dict]:
    """
    Load source rows for OTM-backed datasets (sport/museums).

    Strategy:
    - if cached source file exists and cache is allowed -> read local JSON
    - otherwise regenerate source JSON via write_otm_dataset flow and read it
    """
    if dataset_id not in OTM_KINDS_BY_DATASET:
        supported = ", ".join(sorted(OTM_KINDS_BY_DATASET))
        raise ValueError(f"Unsupported OTM dataset_id: {dataset_id}. Supported: {supported}")

    source_path = SOURCE_FILE_MAP[dataset_id]
    has_local_source = source_path.exists() and source_path.stat().st_size > 0

    if use_cache and not force_download and has_local_source:
        rows = _read_rows(source_path)
        return rows[:limit] if limit is not None else rows

    write_otm_dataset(
        target_size=limit if limit is not None else 500,
        oversample_factor=oversample_factor,
        kinds=OTM_KINDS_BY_DATASET[dataset_id],
        rate=rate,
        seed=seed,
        output_path=source_path,
    )

    if not source_path.exists() or source_path.stat().st_size == 0:
        raise RuntimeError(f"OTM source file was not generated: {source_path}")

    rows = _read_rows(source_path)
    return rows[:limit] if limit is not None else rows
