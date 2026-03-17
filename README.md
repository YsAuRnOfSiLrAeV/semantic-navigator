# Travel Semantic Navigator

## Overview
Travel Semantic Navigator is a React + FastAPI app for semantic exploration of travel attractions on a 2D map.

Core flow:
- backend builds attraction points with embeddings/clusters;
- frontend renders interactive points on a map;
- user can run semantic search and get top nearest attractions.

## Dataset
Current dataset: `itinerai/attractions`.

## Backend API
Implemented endpoints:
- `GET /points?limit=...` -> `TravelPoint[]`
- `POST /semantic-search` -> semantic nearest points by query

Example semantic request:
```json
{
  "query": "chill on beach",
  "top_k": 30,
  "limit": 10500
}
```

## Frontend State Management
Primary shared state management: **custom state manager** (`@ysaurnofsilraev/state-manager`).

State files:
- `frontend/src/state/mapEngine.ts`
- `frontend/src/state/mapActions.ts`
- `frontend/src/state/mapHooks.ts`

Current shared map state includes:
- `points: TravelPoint[]`
- `selectedId: string | null`
- `open: boolean`
- `loading: boolean`
- `error: string | null`
- `limitChoice: LimitChoice`
- `customLimit: string`
- `semanticQuery: string`
- `semanticLoading: boolean`
- `semanticError: string | null`

## API Layer
Frontend API module:
- `frontend/src/api/api.ts`

Typed operations:
- `fetchPoints(limit?, signal?)`
- `searchSemanticPoints(query, { topK, limit, signal })`

## Routes
- `/` - Home
- `/map` - Semantic map
- `/about` - About

## Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DEFAULT_POINTS_LIMIT=10500
VITE_LIMIT_INPUT_DEBOUNCE_MS=450
VITE_MAX_REVIEW_TAGS=18
VITE_SEMANTIC_TOP_K=30
```

### Backend (`backend/.env`)
```env
POINTS_LIMIT=10500
POINTS_SEED=42
UMAP_N_NEIGHBORS=15
UMAP_MIN_DIST=0.1
MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
DATASET_ID=itinerai/attractions
DATASET_SPLIT=train
FRONTEND_URL=http://localhost:5173
```

## Run Locally

### Backend
```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend
```bat
cd frontend
npm install
npm run dev
```

## Validation
```bat
cd frontend
npx tsc --noEmit
npm run build
```

## AI Usage Statement
AI was used as an engineering assistant for architecture decisions, debugging, API/state integration guidance, and documentation updates.  
All final code and behavior were verified manually in the project.
