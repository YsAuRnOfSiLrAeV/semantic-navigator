import json
import os
from pathlib import Path
from datasets import load_dataset

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_FILE = DATA_DIR / "attractions.json"


def load_attractions(
    limit: int = 10500,
    use_cache: bool = True,
    force_download: bool = False,
    seed: int = 42
) -> list[dict]:
    """
    Load up to 'limit' attractions items for the semantic map.
    If 'use_cache' is enabled and 'data/attractions.json' exists, read from the local file.
    Otherwise load the dataset from Hugging Face (use local HF cache by default, set 'force_download' to re-download),
    shuffle with 'seed' for a diverse reproducible sample, and persist the result to 'data/attractions.json'.
    Returns: list of dicts with keys: link, headline, short_description, category.
    """
    if use_cache and DATA_FILE.exists():
        with open(DATA_FILE, encoding="utf-8") as f:
            rows = json.load(f)
        return rows[:limit]

    # if force_download is True, download the dataset from Hugging Face
    # otherwise use local cache
    dataset_id = os.getenv("DATASET_ID", "itinerai/attractions")
    dataset_split = os.getenv("DATASET_SPLIT", "train")
    if force_download:
        dataset = load_dataset(dataset_id, split=dataset_split, download_mode="force_redownload")
    else:
        dataset = load_dataset(dataset_id, split=dataset_split)
    dataset = dataset.shuffle(seed=seed) # diversify the sample (not biased first N), seed keeps it reproducible
    dataset = dataset.select(range(min(limit, len(dataset))))

    # convert dataset to list of dicts, so it can be saved as JSON
    rows = [{"name": row["NAME"] or "",
            "description": row["DESCRIPTION"] or "",
            "categories": row["CATEGORIES"] or [],
            "review_tags": row["REVIEW_TAGS"] or [],
            "destination": row["DESTINATION"] or "",
            "rating": row["RATING"] or "",
            "attraction_url": row["ATTRACTION_URL"] or "",
            "tripadvisor_url": row["TRIPADVISOR_URL"] or "",
            "picture": row["PICTURE"] or ""}
            for row in dataset]

    DATA_DIR.mkdir(parents=True, exist_ok=True) # exist_ok=True: if directory already exists, error is not raised
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":")) # ensure_ascii=False: non-ASCII characters are not escaped
    return rows