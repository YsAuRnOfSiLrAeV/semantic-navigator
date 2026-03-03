# Travel Semantic Navigator

## Overview

Travel Semantic Navigator is a React + FastAPI application for semantic exploration of travel attractions on a 2D map.
The backend builds embeddings and clusters for attractions from the `itinerai/attractions` dataset, and the frontend displays them as interactive points with destination, rating, categories, review tags, and external links.

This repository is currently being extended for Project 3 with a custom React hook and hook tests.

## Theme

The theme of the project is semantic travel discovery.
Instead of listing attractions in a flat catalog, the app maps semantically similar places close to each other so the user can explore destinations visually.

Why this theme fits the assignment:
- it has meaningful UI state and interactions;
- it has a clear domain model (`TravelPoint`, filters, selected point, detail panel);
- it supports scalable future logic such as semantic search, travel intent prompts, and saved places.

## Dataset

The current backend uses the `itinerai/attractions` dataset.
It provides global attraction coverage with destinations such as Amsterdam, Bali, Bangkok, Berlin, Boston, Cape Town, Dubai, Istanbul, London, Miami, New Delhi, New York City, Paris, Rome, Seoul, Singapore, Sydney, Tokyo, Toronto, Vancouver, Zurich, and more.

The dataset fields currently used by the app include:
- attraction name;
- description;
- destination;
- categories;
- review tags;
- rating;
- attraction and TripAdvisor links;
- image URL.

## Project 3: Custom Hook

The main Project 3 addition is the custom hook `useSemanticNavigator` in `frontend/src/hooks/useSemanticNavigator.ts`.
It centralizes semantic map state and removes heavy state logic from `MapPage`.

### Hook Operations

1. `setLimitChoice` - updates the selected predefined point limit.
2. `setCustomLimit` - updates the custom numeric limit input.
3. `selectPoint` - selects a point and opens the details panel.
4. `closeDetails` - closes the mobile details panel.
5. `clearError` - clears the current frontend error state.

Additional hook behavior:
- automatically fetches points when `limitChoice` or `customLimit` changes;
- manages loading and error states;
- preserves the selected point when possible after reloading data.

## Domain Types

Type definitions live in `frontend/src/types.ts`.

Current core types:
- `TravelPoint`
- `SemanticNavigatorState`
- `TravelQuery`
- `SavedPlace`
- `LimitChoice`

## Frontend Structure

Relevant frontend files:
- `frontend/src/App.tsx` - top-level app shell and route composition.
- `frontend/src/main.tsx` - React entry point.
- `frontend/src/pages/HomePage.tsx` - home screen.
- `frontend/src/pages/MapPage.tsx` - semantic map page using the custom hook.
- `frontend/src/pages/AboutPage.tsx` - project description page.
- `frontend/src/hooks/useSemanticNavigator.ts` - custom Project 3 hook.
- `frontend/src/hooks/useSemanticNavigator.test.ts` - hook tests.
- `frontend/src/components/MapPlot.tsx` - Plotly semantic map.
- `frontend/src/components/MapControls.tsx` - point-limit controls.
- `frontend/src/components/PointDetailsPanel.tsx` - desktop and mobile detail panel content.

## Routes

Configured routes:
- `/` - Home page
- `/map` - Semantic map page
- `/about` - About page

## Environment Variables

Frontend variables are configured through Vite env files.

Example `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DEFAULT_POINTS_LIMIT=10500
VITE_LIMIT_INPUT_DEBOUNCE_MS=450
VITE_MAX_REVIEW_TAGS=18
```

## Backend Setup

From the repository root:

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Backend notes:
- API runs on `http://127.0.0.1:8000`
- the app uses sentence-transformer embeddings, UMAP projection, and clustering
- the backend currently depends on a `datasets` version compatible with `itinerai/attractions`

## Frontend Setup

From the repository root:

```bat
cd frontend
npm install
npm run dev
```

The Vite dev server usually runs on `http://localhost:5173` or `http://localhost:5174`.

## Running Tests

From `frontend/`:

```bat
npm install
npm run test
```

## Test Coverage

Current automated coverage includes:
- hook initialization test for `useSemanticNavigator`

Planned next hook tests:
- `setLimitChoice` updates state correctly
- `setCustomLimit` updates state correctly
- `selectPoint` opens the details panel and stores the selected id
- `closeDetails` closes the panel
- invalid custom limit sets an error state

## Build Verification

Useful checks:

```bat
cd frontend
npx tsc --noEmit
npm run build
npm run test
```

## AI Usage Statement

AI was used as a coding assistant for:
- breaking the assignment into implementation steps;
- reviewing state management structure for the custom hook;
- suggesting refactors for `MapPage`, `MapPlot`, and the details panel;
- helping scaffold README and test setup.

All code and structural decisions were reviewed manually and adjusted inside the project.
