# Semantic Navigator

## Theme

This project is a travel-focused semantic discovery app.  
Users explore places on a 2D semantic map, open details for each point, and navigate between core app pages.

Current data status:
- The current running backend still uses a news dataset as a temporary base from an earlier raw project version.
- The target direction for this project is a travel dataset and travel-specific semantics in the next refinement phase.

Why this theme:
- It has meaningful state interactions (selected point, loading/error states, limit controls, responsive side panel).
- It has clear room for business logic growth (semantic query, filtering, shortlist/wishlist).
- It is motivating to evolve through future project stages.

## Domain Types

Type definitions are in `frontend/src/types.ts`.

Current core types:
- `TravelPoint`: one mapped semantic point returned by backend.
- `TravelQuery`: shape of a semantic search query input.
- `SavedPlace`: shape for user-saved travel items.
- `LimitChoice` (union): `"500" | "1000" | "3000" | "5000" | "custom"`.

## Project Structure And Routes

Frontend structure:
- `frontend/src/main.tsx`: wraps app with `BrowserRouter`.
- `frontend/src/App.tsx`: route table + top-level layout.
- `frontend/src/components/Navbar.tsx`: navigation links.
- `frontend/src/pages/HomePage.tsx`: home route.
- `frontend/src/pages/MapPage.tsx`: semantic map screen and interaction logic.
- `frontend/src/pages/AboutPage.tsx`: about route.

Configured routes:
- `/` -> `HomePage`
- `/map` -> `MapPage`
- `/about` -> `AboutPage`

## AI Usage

AI was used as a coding assistant for:
- Breaking assignment requirements into implementation steps.
- Proposing type structures and React Router setup.
- Suggesting refactoring strategy from a heavy `App.tsx` into pages/components.

Verification performed manually:
- Checked that all navigation links work between routes.
- Ran `npm run build` successfully.

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**

## Backend (FastAPI)

From the repo root:

1) Create and activate a virtual environment:

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
```

2) Install dependencies:

```bat
pip install -r requirements.txt
```

3) Start the API server:

```bat
uvicorn app.main:app --reload
```

The backend will start on `http://127.0.0.1:8000`.

Notes:
- On the first run, the app will download the Hugging Face dataset and embedding model.
- CORS must allow your frontend origin (for example `http://localhost:5173` or `http://localhost:5174`).

## Frontend (React + Vite)

From the repo root:

1) Install dependencies:

```bat
cd frontend
npm install
```

2) Start the dev server:

```bat
npm run dev
```

Open the app at the URL printed by Vite (usually `http://localhost:5173` or `http://localhost:5174`).
