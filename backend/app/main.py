from __future__ import annotations

import os
from contextlib import asynccontextmanager

import anyio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.services.embedding import build_points


def _get_int(name: str, default: int) -> int:
    v = os.getenv(name)
    return int(v) if v is not None else default


def _get_float(name: str, default: float) -> float:
    v = os.getenv(name)
    return float(v) if v is not None else default


@asynccontextmanager
async def lifespan(app: FastAPI):
    # precompute points once at startup, keep in memory
    limit = _get_int("POINTS_LIMIT", 5000)
    seed = _get_int("POINTS_SEED", 42)
    umap_n_neighbors = _get_int("UMAP_N_NEIGHBORS", 15)
    umap_min_dist = _get_float("UMAP_MIN_DIST", 0.1)

    app.state.startup_error = None
    app.state.points = []

    try:
        # allocate a separate thread for processing the build_points function
        app.state.points = await anyio.to_thread.run_sync(
            lambda: build_points(
                limit=limit,
                use_cache=True,
                force_download=False,
                seed=seed,
                umap_n_neighbors=umap_n_neighbors,
                umap_min_dist=umap_min_dist,
            )
        )
    except Exception as e:
        # keep server running, but mark points data as unavailable
        app.state.startup_error = f"{type(e).__name__}: {e}"

    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)