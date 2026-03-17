# App Overview
Travel Semantic Navigator is a React + FastAPI application for semantic exploration of travel attractions on a 2D map.

Purpose:
- load attraction points from backend;
- visualize semantic neighborhoods on a map;
- open detailed info for a selected place;
- run semantic search from free-text user query.

Core entities:
- `TravelPoint`
- map controls (`limitChoice`, `customLimit`)
- selected point (`selectedId`)
- details drawer (`open`)
- semantic query flow (`semanticQuery`, semantic results)

# State Management Approach
Primary shared state management: custom engine from `@ysaurnofsilraev/state-manager`.

Why this approach:
- lightweight hooks-based shared state;
- direct typed read/write APIs without Redux boilerplate;
- simple expansion path for future pages and domains.

Store location:
- `frontend/src/state/mapEngine.ts`
- `frontend/src/state/mapActions.ts`
- `frontend/src/state/mapHooks.ts`

Local `useState` is allowed for strictly local UI-only concerns.

# State Shape
```ts
type MapState = {
  points: TravelPoint[];
  selectedId: string | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  limitChoice: LimitChoice;
  customLimit: string;
  semanticQuery: string;
  semanticLoading: boolean;
  semanticError: string | null;
};
```

# API Conventions
API transport: `fetch`.

Frontend API module:
- `frontend/src/api/api.ts`

Conventions:
- UI calls typed API functions (`fetchPoints`, `searchSemanticPoints`), not inline URLs.
- Non-OK responses throw `Error` with status context.
- Async UI state is reflected in shared state (`loading/error`, `semanticLoading/semanticError`).

Current backend operations:
- `GET /points?limit=...` -> `TravelPoint[]`
- `POST /semantic-search` -> top nearest semantic matches (`point + score`)

# File Structure
- `frontend/src/types.ts` - shared domain/API types.
- `frontend/src/state/` - shared state engine, actions, hooks.
- `frontend/src/api/` - typed API access functions.
- `frontend/src/components/` - reusable UI components.
- `frontend/src/pages/` - route-level composition.
- `backend/app/` - FastAPI app, ingest, embeddings, routes.

Naming conventions:
- Pages: `*Page.tsx`
- State files: `mapEngine.ts`, `mapActions.ts`, `mapHooks.ts`
- API module: `api.ts`

# Adding New Features
1. Add/extend domain types in `frontend/src/types.ts`.
2. Extend shared state in `frontend/src/state/mapEngine.ts`.
3. Add actions in `frontend/src/state/mapActions.ts`.
4. Add/extend API function in `frontend/src/api/api.ts`.
5. Wire UI using `useMapValue` / `useSelectedPoint` and state actions.
6. Validate before commit:
   - `npx tsc --noEmit`
   - `npm run dev`
   - manual UI flow check
