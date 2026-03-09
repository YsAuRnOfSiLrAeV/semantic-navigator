from __future__ import annotations

import os
from contextlib import asynccontextmanager

import anyio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

from app.api.routes import router
from app.services.embedding import build_points

from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # precompute points once at startup, keep in memory
    limit = int(os.getenv("POINTS_LIMIT", 10500))
    seed = int(os.getenv("POINTS_SEED", 42))
    umap_n_neighbors = int(os.getenv("UMAP_N_NEIGHBORS", 15))
    umap_min_dist = float(os.getenv("UMAP_MIN_DIST", 0.1))

    app.state.startup_error = None
    app.state.points = []
    app.state.model = None

    try:
        app.state.model = SentenceTransformer(os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"))
        # allocate a separate thread for processing the build_points function
        app.state.points = await anyio.to_thread.run_sync(
            lambda: build_points(
                model=app.state.model,
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
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173"), "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)