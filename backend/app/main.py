from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

import anyio
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

from app.api.routes import router
from app.services.datasets.contracts import OrchestratorSettings
from app.services.datasets.dataset_storage import DatasetStorage
from app.services.datasets.dataset_storage_orchestrator import load_prepared_dataset

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATASETS_ROOT = BACKEND_ROOT / "data" / "datasets"

DATASET_SOURCE_BY_ID: dict[str, str] = {
    "attractions_global": "itinerai",
    "sport_global": "otm",
    "museums_global": "otm",
    # "motorsport_global": "overpass",  # додаси після реалізації overpass loader
}

DEFAULT_DATASET_ID = "attractions_global"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global_points_limit = int(os.getenv("POINTS_LIMIT", "10500"))
    otm_points_limit = int(os.getenv("OTM_POINTS_LIMIT", "500"))

    seed = int(os.getenv("POINTS_SEED", "42"))
    umap_n_neighbors = int(os.getenv("UMAP_N_NEIGHBORS", "15"))
    umap_min_dist = float(os.getenv("UMAP_MIN_DIST", "0.1"))

    force_download = os.getenv("FORCE_DOWNLOAD", "false").strip().lower() == "true"

    model_name = os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    datasets_root = Path(os.getenv("DATASETS_ROOT", str(DEFAULT_DATASETS_ROOT)))
    default_dataset_id = os.getenv("DEFAULT_DATASET_ID", DEFAULT_DATASET_ID)

    enabled_raw = os.getenv("ENABLED_DATASET_IDS", ",".join(DATASET_SOURCE_BY_ID.keys()))
    enabled_dataset_ids = [item.strip() for item in enabled_raw.split(",") if item.strip()]

    app.state.startup_error = None
    app.state.dataset_errors = {}
    app.state.datasets = {}
    app.state.default_dataset_id = default_dataset_id
    app.state.model = None

    try:
        app.state.model = SentenceTransformer(model_name)
        storage = DatasetStorage(datasets_root=datasets_root)

        for dataset_id in enabled_dataset_ids:
            dataset_source = DATASET_SOURCE_BY_ID.get(dataset_id)
            if dataset_source is None:
                app.state.dataset_errors[dataset_id] = f"Unsupported dataset_id: {dataset_id}"
                continue

            points_limit = global_points_limit if dataset_source == "itinerai" else otm_points_limit

            settings = OrchestratorSettings(
                dataset_id=dataset_id,
                dataset_source=dataset_source,
                dataset_split=os.getenv("DATASET_SPLIT", "train"),
                points_limit=points_limit,
                seed=seed,
                umap_n_neighbors=umap_n_neighbors,
                umap_min_dist=umap_min_dist,
                force_download=force_download,
            )

            try:
                prepared = await anyio.to_thread.run_sync(
                    lambda current_settings=settings: load_prepared_dataset(
                        storage=storage,
                        model=app.state.model,
                        settings=current_settings,
                    )
                )
                app.state.datasets[dataset_id] = prepared
            except Exception as dataset_error:
                app.state.dataset_errors[dataset_id] = (
                    f"{type(dataset_error).__name__}: {dataset_error}"
                )

        if not app.state.datasets:
            raise RuntimeError(f"No datasets loaded. Errors: {app.state.dataset_errors}")

        if app.state.default_dataset_id not in app.state.datasets:
            raise RuntimeError(
                f"Default dataset '{app.state.default_dataset_id}' is not loaded. "
                f"Loaded: {list(app.state.datasets.keys())}. "
                f"Errors: {app.state.dataset_errors}"
            )

    except Exception as e:
        app.state.startup_error = f"{type(e).__name__}: {e}"

    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173"), "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
