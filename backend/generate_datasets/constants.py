from __future__ import annotations
from typing import Final

CONTINENT_PERCENTAGES: Final[dict[str, float]] = {
    "Europe": 0.25,
    "North America": 0.23,
    "Asia": 0.20,
    "South America": 0.12,
    "Africa": 0.12,
    "Oceania": 0.08,
}

# Manual bboxes per continent for OTM /bbox endpoint.
# Format: lon_min, lat_min, lon_max, lat_max
CONTINENT_BBOXES: Final[dict[str, tuple[float, float, float, float]]] = {
    "Europe": (-31.0, 34.0, 60.0, 72.0),
    "North America": (-169.0, 7.0, -52.0, 84.0),
    "Asia": (26.0, -11.0, 180.0, 81.0),
    "South America": (-82.0, -56.0, -34.0, 13.0),
    "Africa": (-19.0, -35.0, 52.0, 38.0),
    "Oceania": (110.0, -50.0, 180.0, 0.0),
}
