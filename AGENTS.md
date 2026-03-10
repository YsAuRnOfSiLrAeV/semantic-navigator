# App Overview
Travel Semantic Navigator is a React + FastAPI application for semantic exploration of travel attractions on a 2D map.

Purpose:
- load attraction points from backend;
- visualize semantic neighborhoods on a map;
- open detailed info for a selected place.

Core entities:
- `TravelPoint`
- map controls (`limitChoice`, `customLimit`)
- selected point (`selectedId`)
- details drawer (`open`)

# State Management Approach
Primary shared state management: Redux Toolkit.

Why this approach:
- shared map state is used by multiple components (`MapControls`, `MapPlot`, `PointDetailsPanel`);
- predictable updates through action -> reducer;
- scalable for future pages (`Home`, `About`, future `User`/favorites).

Store location:
- `frontend/src/store/index.ts`
- `frontend/src/store/mapSlice.ts`
- `frontend/src/store/hooks.ts`
- `frontend/src/store/selectors.ts`

Local `useState` is still allowed for strictly local UI-only concerns (example: temporary “show more tags” toggle inside details content).

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
};
```

Root state is configured as:
```ts
{
  map: MapState
}
```

# API Conventions
API transport: `fetch`.

Current API module:
- `frontend/src/api/api.ts`

Conventions:
- UI components/pages must call typed API functions (e.g. `fetchPoints`) instead of composing request URLs inline.
- Non-OK responses throw `Error` with readable status.
- Async UI status is represented in Redux (`loading`, `error`).

Current operation:
- `GET /points?limit=...` -> `TravelPoint[]`

# File Structure
- `frontend/src/types.ts` - shared domain types.
- `frontend/src/store/` - Redux store config, slice, selectors, typed hooks.
- `frontend/src/api/` - API functions.
- `frontend/src/components/` - reusable UI components.
- `frontend/src/pages/` - route-level page composition.
- `backend/app/` - FastAPI app, ingestion, embeddings, clustering.

Naming conventions:
- Slice files: `*Slice.ts`
- Selectors: `selectors.ts`
- Pages: `*Page.tsx`

# Adding New Features
1. Add/extend domain type in `frontend/src/types.ts`.
2. Add Redux fields/actions in `frontend/src/store/mapSlice.ts` (or create a new slice for a new domain).
3. Add API function in `frontend/src/api/api.ts`.
4. Connect UI with `useAppSelector` and `useAppDispatch`.
5. Keep derived logic in selectors when used in multiple components.
6. Validate before commit:
   - `npx tsc --noEmit`
   - `npm run dev`
   - manual UI flow check for the new feature.
