from __future__ import annotations

import math
import os
import requests
from urllib.parse import quote, unquote, urlparse

from generate_datasets.constants import CONTINENT_PERCENTAGES, CONTINENT_BBOXES


def _get_otm_base_url() -> str:
    base_url = os.getenv("OPENTRIPMAP_BASE_URL", "https://api.opentripmap.com/0.1/en/places").strip()
    if not base_url:
        raise ValueError("Missing OPENTRIPMAP_BASE_URL environment variable.")
    return base_url


def _get_otm_api_key() -> str:
    api_key = os.getenv("OPENTRIPMAP_API_KEY", "").strip()
    if not api_key:
        raise ValueError("Missing OPENTRIPMAP_API_KEY environment variable.")
    return api_key


def _compute_fetch_targets(
    *,
    target_size: int,
    oversample_factor: float,
    percentages: dict[str, float] = CONTINENT_PERCENTAGES,
) -> dict[str, int]:
    """
    Compute per-continent fetch targets for oversampling stage.

    Why:
    - build-stage needs high-quality candidate pool larger than final target,
    - this function converts final target + continent percentages into raw fetch counts.

    Example:
    - target_size=500, oversample_factor=3, Europe=0.25 -> 375.
    """

    if target_size <= 0:
        raise ValueError("target_size must be > 0")
    if oversample_factor <= 0:
        raise ValueError("oversample_factor must be > 0")

    percent_sum = sum(percentages.values())
    if abs(percent_sum - 1.0) > 1e-9:
        raise ValueError(f"Percentages must sum to 1.0, got {percent_sum}")

    targets: dict[str, int] = {}
    for continent, pct in percentages.items():
        targets[continent] = int(math.ceil(target_size * pct * oversample_factor))
    return targets


def _otm_get_json(
    path: str,
    *,
    params: dict[str, str | int | float],
    api_key: str,
) -> dict | list:
    """
    Execute one OpenTripMap GET request and return parsed JSON payload.

    Why:
    - centralize request URL building, apikey injection and timeout behavior,
    - keep HTTP error handling consistent across all OTM calls.

    Raises:
    - requests.HTTPError for non-2xx responses.
    """
    url = f"{_get_otm_base_url()}/{path}"
    query = dict(params)
    query["apikey"] = api_key

    response = requests.get(url, params=query, timeout=30)
    response.raise_for_status()
    return response.json()


def _fetch_bbox_candidates(
    *,
    continent: str,
    limit: int,
    offset: int,
    api_key: str,
    kinds: str,
    rate: str = "3",
) -> list[dict]:
    """
    Fetch one paginated candidate batch from OTM /bbox for a specific continent.

    Why:
    - /bbox is used as discovery layer (compact items with xid),
    - detailed enrichment is done later via /xid/{xid}.

    Returns:
    - list of compact candidate dicts (may be empty).
    """
    if continent not in CONTINENT_BBOXES:
        raise ValueError(f"Unknown continent: {continent}")

    lon_min, lat_min, lon_max, lat_max = CONTINENT_BBOXES[continent]

    data = _otm_get_json(
        "bbox",
        params={
            "lon_min": lon_min,
            "lat_min": lat_min,
            "lon_max": lon_max,
            "lat_max": lat_max,
            "kinds": kinds,
            "rate": rate,
            "limit": limit,
            "offset": offset,
            "format": "json",
        },
        api_key=api_key,
    )

    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def _fetch_place_details(*, xid: str, api_key: str) -> dict:
    """
    Fetch full OTM details for a single place by xid.

    Why:
    - compact bbox items do not provide enough fields for row contract
    (description, image, source URL, destination).
    """
    return _otm_get_json(f"xid/{xid}", params={}, api_key=api_key)


def _extract_wikimedia_file_title(raw_url: str) -> str | None:
    """
    Extract Wikimedia file title (`File:...`) from different URL shapes.

    Why:
    - OTM may return either a Wikipedia file-page URL or a direct upload.wikimedia URL.
    - we need a normalized `File:...` title to build a stable image link.
    """
    if not raw_url:
        return None

    parsed = urlparse(raw_url)
    host = parsed.netloc.lower()
    path = parsed.path

    if "/wiki/File:" in path:
        file_title = path.split("/wiki/", 1)[1]
        return unquote(file_title).strip() or None

    if "upload.wikimedia.org" in host:
        parts = [p for p in path.split("/") if p]
        if "thumb" in parts:
            idx = parts.index("thumb")
            if len(parts) > idx + 3:
                file_name = unquote(parts[idx + 3]).strip()
                if file_name:
                    return f"File:{file_name}"
        if parts:
            file_name = unquote(parts[-1]).strip()
            if file_name:
                return f"File:{file_name}"

    return None


def _build_wikimedia_redirect_image_url(file_title: str, width: int = 640) -> str:
    """
    Build a stable Wikimedia redirect image URL from `File:...` title.

    Why:
    - many raw thumbnail URLs from OTM are unreliable/hotlink-fragile,
    - `Special:Redirect/file/...` is more stable for `<img src>`.
    """
    encoded = quote(file_title.strip(), safe=":_")
    return (
        "https://commons.wikimedia.org/w/index.php?"
        f"title=Special:Redirect/file/{encoded}&width={width}"
    )


def _resolve_otm_picture_url(details: dict) -> str:
    """
    Resolve final picture URL for one OTM place details payload.

    Strategy:
    - try to normalize Wikimedia URLs via `File:...` -> stable redirect URL,
    - if not possible, fallback to OTM `preview.source` or `image`.

    Why:
    - maximize image render success rate while keeping non-Wikimedia images.
    """
    preview_source = str((details.get("preview") or {}).get("source") or "").strip()
    image_source = str(details.get("image") or "").strip()

    for candidate in (image_source, preview_source):
        title = _extract_wikimedia_file_title(candidate)
        if title:
            return _build_wikimedia_redirect_image_url(title, width=640)

    return preview_source or image_source


def _map_otm_details_to_row(*, details: dict, continent: str) -> dict | None:
    """
    Map OTM details payload into project row contract (+continent).

    Why:
    - convert source-specific response shape to canonical fields expected by build step,
    - enforce hard-required fields early to reduce downstream noise.

    Returns:
    - canonical-like row dict, or None if required fields are missing.
    """
    name = str(details.get("name") or "").strip()

    kinds_text = str(details.get("kinds") or "").strip()
    categories = [k.replace("_", " ").strip() for k in kinds_text.split(",") if k.strip()]

    wiki = details.get("wikipedia_extracts") or {}
    info = details.get("info") or {}
    description = str(wiki.get("text") or info.get("descr") or "").strip()

    address = details.get("address") or {}
    destination = str(
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("state")
        or address.get("country")
        or ""
    ).strip()

    source_url = str(details.get("url") or details.get("otm") or "").strip()
    picture = _resolve_otm_picture_url(details)

    row = {
        "name": name,
        "description": description,
        "categories": categories,
        "review_tags": [],              # OTM does not provide real review tags
        "destination": destination,      # may be empty if address has no fields
        "rating": str(details.get("rate") or ""),
        "source_url": source_url,
        "tripadvisor_url": "",           # OTM does not provide this directly
        "picture": picture,
        "continent": continent,
    }

    # Hard-required fields for fetch stage
    if not row["name"]:
        return None
    if not row["description"]:
        return None
    if not row["categories"]:
        return None
    if not row["source_url"]:
        return None
    if not row["picture"]:
        return None
    if not row["continent"]:
        return None

    return row


def fetch_otm_rows_by_continent(
    *,
    target_size: int,
    oversample_factor: float,
    kinds: str,
    rate: str = "3",
    page_size: int = 200,
    max_pages_per_continent: int = 30,
) -> dict[str, list[dict]]:
    """
    Fetch oversampled OTM rows grouped by continent using shared percentage plan.

    Flow:
    1) compute per-continent fetch targets,
    2) page through /bbox candidates,
    3) fetch /xid details for each xid,
    4) map details to row contract,
    5) deduplicate by xid and source_url,
    6) stop when continent target is reached.

    Returns:
    - dict[continent, list[row]] for build-stage input.

    Note:
    - this function does NOT reduce to final dataset size.
    - final downsampling/selection is done in build_*_dataset.
    """
    if target_size <= 0:
        raise ValueError("target_size must be > 0")
    if oversample_factor <= 0:
        raise ValueError("oversample_factor must be > 0")
    if page_size <= 0:
        raise ValueError("page_size must be > 0")
    if max_pages_per_continent <= 0:
        raise ValueError("max_pages_per_continent must be > 0")

    api_key = _get_otm_api_key()
    fetch_targets = _compute_fetch_targets(
        target_size=target_size,
        oversample_factor=oversample_factor,
    )

    result: dict[str, list[dict]] = {continent: [] for continent in CONTINENT_PERCENTAGES.keys()}

    for continent, target in fetch_targets.items():
        rows_for_continent: list[dict] = []
        seen_xids: set[str] = set()
        seen_source_urls: set[str] = set()

        for page_index in range(max_pages_per_continent):
            if len(rows_for_continent) >= target:
                break

            offset = page_index * page_size
            candidates = _fetch_bbox_candidates(
                continent=continent,
                limit=page_size,
                offset=offset,
                api_key=api_key,
                kinds=kinds,
                rate=rate,
            )

            if not candidates:
                break

            for item in candidates:
                xid = str(item.get("xid", "")).strip()
                if not xid or xid in seen_xids:
                    continue
                seen_xids.add(xid)

                try:
                    details = _fetch_place_details(xid=xid, api_key=api_key)
                except Exception:
                    continue

                row = _map_otm_details_to_row(details=details, continent=continent)
                if row is None:
                    continue

                source_url = str(row.get("source_url", "")).strip()
                if not source_url:
                    continue
                if source_url in seen_source_urls:
                    continue

                seen_source_urls.add(source_url)
                rows_for_continent.append(row)

                if len(rows_for_continent) >= target:
                    break

        result[continent] = rows_for_continent

    return result
