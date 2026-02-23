import json
import os
from pathlib import Path
from datasets import load_dataset

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_FILE = DATA_DIR / "news.json"


def load_news(
    limit: int = 5000,
    use_cache: bool = True,
    force_download: bool = False,
    seed: int = 42
) -> list[dict]:
    """
    Load up to 'limit' news items for the semantic map.
    If 'use_cache' is enabled and 'data/news.json' exists, read from the local file.
    Otherwise load the dataset from Hugging Face (use local HF cache by default, set 'force_download' to re-download),
    shuffle with 'seed' for a diverse reproducible sample, and persist the result to 'data/news.json'.
    Returns: list of dicts with keys: link, headline, short_description, category.
    """
    if use_cache and DATA_FILE.exists():
        with open(DATA_FILE, encoding="utf-8") as f:
            rows = json.load(f)
        return rows[:limit]

    # if force_download is True, download the dataset from Hugging Face
    # otherwise use local cache
    dataset_id = os.getenv("DATASET_ID", "heegyu/news-category-dataset")
    dataset_split = os.getenv("DATASET_SPLIT", "train")
    if force_download:
        dataset = load_dataset(dataset_id, split=dataset_split, download_mode="force_redownload")
    else:
        dataset = load_dataset(dataset_id, split=dataset_split)
    dataset = dataset.shuffle(seed=seed) # diversify the sample (not biased first N), seed keeps it reproducible
    dataset = dataset.select(range(min(limit, len(dataset))))

    # convert dataset to list of dicts, so it can be saved as JSON
    rows = [{"link": row["link"] or "",
            "headline": row["headline"] or "",
            "short_description": row["short_description"] or "",
            "category": row.get("category") or ""}
            for row in dataset]

    DATA_DIR.mkdir(parents=True, exist_ok=True) # exist_ok=True: if directory already exists, error is not raised
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":")) # ensure_ascii=False: non-ASCII characters are not escaped
    return rows