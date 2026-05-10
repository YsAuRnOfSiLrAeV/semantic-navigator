from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .build_otm_dataset import build_otm_dataset

from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)

DEFAULT_OUTPUT_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "sources" / "sport_global.json"
)


def _write_rows_to_json(rows: list[dict[str, Any]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file_handle:
        json.dump(rows, file_handle, ensure_ascii=False, separators=(",", ":"))


def write_otm_dataset(
    *,
    target_size: int = 500,
    oversample_factor: float = 6.0,
    kinds: str,
    rate: str = "3",
    seed: int = 42,
    output_path: Path = DEFAULT_OUTPUT_PATH,
) -> Path:
    rows = build_otm_dataset(
        target_size=target_size,
        oversample_factor=oversample_factor,
        kinds=kinds,
        rate=rate,
        seed=seed,
    )
    _write_rows_to_json(rows, output_path)
    return output_path


# To run with a command needs to have a value of kinds in args
if __name__ == "__main__":
    written_output_path = write_otm_dataset()
    print(f"Dataset written to: {written_output_path}")
