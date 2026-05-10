from __future__ import annotations

from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[3]
DATA_SOURCES_DIR = BACKEND_ROOT / "data" / "sources"

SOURCE_FILE_MAP: dict[str, Path] = {
    "attractions_global": DATA_SOURCES_DIR / "attractions_global.json",
    "sport_global": DATA_SOURCES_DIR / "sport_global.json",
    "museums_global": DATA_SOURCES_DIR / "museums_global.json",
    "motorsport_global": DATA_SOURCES_DIR / "motorsport_global.json",
}
