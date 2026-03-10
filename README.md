# Travel Semantic Navigator

## Overview
Travel Semantic Navigator is a React + FastAPI app for semantic exploration of travel attractions on a 2D map.
The backend computes embeddings/clusters and the frontend visualizes interactive points with destination, rating, categories, review tags, and source links.

## Dataset
Current dataset: `itinerai/attractions`.

## Backend Integration Status
Backend integration is already implemented.

Current integration details:
- backend endpoint: `GET /points?limit=...`
- frontend API module: `frontend/src/api/api.ts`
- frontend map page loads data from backend and renders Plotly points

This project does not use mock backend data in runtime flow: map data comes from the live FastAPI endpoint.

## State Management (Project 4)
Primary state management library: **Redux Toolkit**.

Why Redux Toolkit:
- shared state across multiple UI blocks (`MapControls`, `MapPlot`, `PointDetailsPanel`)
- predictable update flow (action -> reducer -> store)
- scalable for future pages/features (user preferences, saved places, semantic search)

Redux files:
- `frontend/src/store/index.ts`
- `frontend/src/store/mapSlice.ts`
- `frontend/src/store/hooks.ts`
- `frontend/src/store/selectors.ts`

Current shared state (`MapState`):
- `points: TravelPoint[]`
- `selectedId: string | null`
- `open: boolean`
- `loading: boolean`
- `error: string | null`
- `limitChoice: LimitChoice`
- `customLimit: string`

## Proof-of-Wiring Operations
Working Redux operations from UI:
1. change points limit (`setLimitChoice`)
2. update custom limit input (`setCustomLimit`)
3. load points (`setLoading`, `setPoints`, `setError`)
4. select map point (`setSelectedId`)
5. open/close details panel (`setOpen`)

## API Layer Note
The project already has a typed API access layer in `frontend/src/api/api.ts` (currently `fetchPoints`).
Backend is integrated directly through this module.

## Agent Instructions
AI-agent instructions file is provided at:
- `AGENTS.md`

It contains:
- app overview
- state management approach
- state shape
- API conventions
- file structure rules
- feature-adding workflow

## Routes
- `/` - Home page
- `/map` - Semantic map page
- `/about` - About page

## Environment Variables
Example `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DEFAULT_POINTS_LIMIT=10500
VITE_LIMIT_INPUT_DEBOUNCE_MS=450
VITE_MAX_REVIEW_TAGS=18
```

## Run Locally
Backend:

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Frontend:

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
AI was used as an engineering assistant for:
- architecture discussion and Redux migration planning
- store/slice/selectors setup review
- code-level troubleshooting and refactor guidance
- project documentation updates

All final changes were reviewed and adjusted manually in the codebase.
