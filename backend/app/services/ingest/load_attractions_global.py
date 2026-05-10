import json
import os
from datasets import load_dataset
from .source_file_map import SOURCE_FILE_MAP

DATA_FILE = SOURCE_FILE_MAP["attractions_global"]
DATA_DIR = DATA_FILE.parent


def load_attractions_global(
    limit: int = 10500,
    use_cache: bool = True,
    force_download: bool = False,
    seed: int = 42
) -> list[dict]:
    """
    Loads normalized source rows for the attractions_global dataset.

    Flow:
    - If local source file exists and use_cache=True, reads rows from local JSON.
    - Otherwise downloads rows from Hugging Face (optionally force redownload),
      shuffles deterministically by seed, truncates to limit, and saves to local JSON.

    Returns:
    - list[dict] with keys:
      name, description, categories, review_tags, destination, rating,
      source_url, tripadvisor_url, picture.
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
            "source_url": row["ATTRACTION_URL"] or "",
            "tripadvisor_url": row["TRIPADVISOR_URL"] or "",
            "picture": row["PICTURE"] or ""}
            for row in dataset]

    DATA_DIR.mkdir(parents=True, exist_ok=True) # exist_ok=True: if directory already exists, error is not raised
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":")) # ensure_ascii=False: non-ASCII characters are not escaped
    return rows