from __future__ import annotations

from random import Random
from typing import Any

from .constants import CONTINENT_PERCENTAGES
from .fetch_otm_rows import fetch_otm_rows_by_continent


def _score_row(row: dict[str, Any]) -> float:
    """
    Score only non-guaranteed quality signals.
    Required fields are already enforced in fetch stage.
    """
    score = 0.0

    # OTM usually has no real TripAdvisor URL, but keep for compatibility.
    if str(row.get("tripadvisor_url", "")).strip():
        score += 0.5

    # destination may be empty in OTM address payload.
    if str(row.get("destination", "")).strip():
        score += 0.5

    # numeric rating signal (OTM "rate")
    try:
        rating_value = float(row.get("rating", ""))
        if rating_value > 0:
            score += 0.5
    except (TypeError, ValueError):
        pass

    return score


# Note:
# Current continent percentages are tuned for target_size=500 and produce exact integer quotas.
# In the future, if target_size or percentages change and fractional quotas appear,
# implement largest-remainder distribution to allocate rounded leftovers deterministically.
def _compute_final_quotas(target_size: int) -> dict[str, int]:
    """
    Return final per-continent quotas for build stage.

    Output format:
    - dict[str, int]: continent -> rows count.

    Current version expects exact integer quotas and raises ValueError otherwise.
    """
    if target_size <= 0:
        raise ValueError("target_size must be > 0")

    final_quota_by_continent: dict[str, int] = {}
    for continent_name, continent_percentage in CONTINENT_PERCENTAGES.items():
        raw_quota_value = target_size * continent_percentage
        if not float(raw_quota_value).is_integer():
            raise ValueError(
                "Non-integer continent quota detected. "
                "Either use target_size=500 or add remainder distribution logic."
            )
        final_quota_by_continent[continent_name] = int(raw_quota_value)

    # Safety check: quotas must exactly match requested dataset size.
    if sum(final_quota_by_continent.values()) != target_size:
        raise ValueError("Final quotas do not sum to target_size.")

    return final_quota_by_continent


def _select_top_rows_by_continent(
    *,
    rows_by_continent: dict[str, list[dict[str, Any]]],
    final_quota_by_continent: dict[str, int],
) -> list[dict[str, Any]]:
    """
    Select top-scored rows per continent by strict quotas.
    No cross-continent rebalance is applied.
    """
    selected_rows: list[dict[str, Any]] = []

    for continent_name, continent_quota in final_quota_by_continent.items():
        continent_rows = rows_by_continent.get(continent_name, [])

        sorted_rows = sorted(
            continent_rows,
            key=_score_row,
            reverse=True,
        )

        selected_for_continent = sorted_rows[:continent_quota]
        selected_rows.extend(selected_for_continent)

    return selected_rows


def _finalize_rows(
    *,
    selected_rows: list[dict[str, Any]],
    target_size: int,
    seed: int,
) -> list[dict[str, Any]]:
    """
    Finalize strict dataset:
    - require exact target size,
    - deterministic shuffle,
    - remove helper field 'continent'.
    """
    if len(selected_rows) != target_size:
        raise ValueError(
            f"Strict quota mode: selected_rows={len(selected_rows)} != target_size={target_size}. "
            "Increase oversample_factor and run again."
        )

    shuffled_rows = list(selected_rows)
    Random(seed).shuffle(shuffled_rows)

    finalized_rows: list[dict[str, Any]] = []
    for row in shuffled_rows:
        row_copy = dict(row)
        row_copy.pop("continent", None)
        finalized_rows.append(row_copy)

    return finalized_rows


def build_otm_dataset(
    *,
    target_size: int = 500,
    oversample_factor: float = 3.0,
    kinds: str,
    rate: str = "3",
    seed: int = 42,
) -> list[dict[str, Any]]:
    """
    Build final motorsport dataset (target_size rows) from oversampled OTM fetch.
    """
    if target_size <= 0:
        raise ValueError("target_size must be > 0")

    rows_by_continent = fetch_otm_rows_by_continent(
        target_size=target_size,
        oversample_factor=oversample_factor,
        kinds=kinds,
        rate=rate,
    )

    final_quota_by_continent = _compute_final_quotas(target_size)

    selected_rows = _select_top_rows_by_continent(
        rows_by_continent=rows_by_continent,
        final_quota_by_continent=final_quota_by_continent,
    )

    final_rows = _finalize_rows(
        selected_rows=selected_rows,
        target_size=target_size,
        seed=seed,
    )

    return final_rows

