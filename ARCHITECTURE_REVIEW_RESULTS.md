# Architecture Review Results

> Analyzed on: 2026-04-15
> Project: semantic-navigator (frontend)
> Total components analyzed: 14 (App, RootLayout, HomePage, AboutPage, MapPage, Navbar, MapViewer, MapPlot, MapControls, ResultLimitSelector, SemanticSearchBar, PointDetailsPanel / PointDetailsPanelMobile / PointDetailsContent)
> Issues found: 6

## Summary

The architecture is fundamentally sound. The API abstraction layer is exemplary — `SemanticNavigatorApi` is a proper class with constructor injection, `mapActions.ts` is its only consumer, and no hook or component ever touches `fetch` directly. The engine → actions → hooks → components layering is clean throughout. Since the previous review, the new semantic search UI (`SemanticSearchBar`, `ResultLimitSelector`) introduced two issues worth addressing: `SemanticSearchBar` reads seven state keys to compute a "already executed" guard that `mapActions.ts` already enforces, and the limit-resolution validation is now written in three separate places. Three lower-priority items from the previous review remain open.

---

## Issues

### ISSUE-01: Layout lives at the router level instead of inside each page

**Severity**: Medium
**Principle**: Missing Layout / App Shell
**Location**: `src/App.tsx`, `src/layouts/RootLayout.tsx`

`RootLayout` is mounted as a router wrapper using `<Outlet />`, which makes pages incomplete fragments that only render correctly when nested inside that specific route configuration. If routing is restructured, or if a page needs to customise the shell (e.g., different padding or a sidebar), the layout is locked at the router level with no clean escape hatch.

#### Current (Bad)

```tsx
// App.tsx — layout is coupled to React Router's Outlet
export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

// RootLayout.tsx — pages rendered as anonymous Outlet content
export default function RootLayout() {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <Outlet />
    </div>
  );
}
```

#### Recommended (Good)

```tsx
// App.tsx — router handles only routing
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

// layouts/RootLayout.tsx — accepts children, no router dependency
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      {children}
    </div>
  );
}

// pages/MapPage.tsx — self-contained, renders its own shell
export default function MapPage() {
  useMapUrlSync();
  usePointsLoader();
  useSemanticAutoRefresh();
  return (
    <RootLayout>
      <MapControls />
      <MapContentArea />
    </RootLayout>
  );
}
```

**Why this is better**: Each page is a complete, self-contained unit. Reading `MapPage.tsx` shows everything it renders, including its shell. Routing changes never affect page layout, and per-page shell customisation becomes a simple prop.

---

### ISSUE-02: `SemanticSearchBar` reads seven state keys to duplicate a guard already in the action layer

**Severity**: Medium
**Principle**: Unclear Data Flow / Code Duplication
**Location**: `src/components/SemanticSearchBar.tsx`, `src/state/mapActions.ts`

`SemanticSearchBar` reads `limitChoice`, `customLimit`, `lastExecutedSemanticQuery`, and `lastExecutedResultLimit` solely to compute `isAlreadyExecutedSearch` — which decides whether to disable the submit button. But `mapActions.ts` already enforces the same guard in `isSameAsLastExecutedSearch` before every API call, meaning a duplicate search is blocked twice: once in the UI and once at the action level. This forces the component to understand `lastExecutedResultLimit` (an internal search-deduplication detail) and to replicate the limit-resolution formula. Seven reactive state subscriptions in a form component is a maintenance burden.

#### Current (Bad)

```tsx
// SemanticSearchBar.tsx — 7 state reads, duplicates action-layer logic
const semanticQuery = useMapValue("semanticQuery");
const semanticLoading = useMapValue("semanticLoading");
const semanticError = useMapValue("semanticError");
const limitChoice = useMapValue("limitChoice");                       // only for isAlreadyExecutedSearch
const customLimit = useMapValue("customLimit");                       // only for isAlreadyExecutedSearch
const lastExecutedSemanticQuery = useMapValue("lastExecutedSemanticQuery");  // only for isAlreadyExecutedSearch
const lastExecutedResultLimit = useMapValue("lastExecutedResultLimit");      // only for isAlreadyExecutedSearch

const selectedResultLimit =
  limitChoice === "custom" ? Number(customLimit) : Number(limitChoice);  // duplicated from mapActions
const isAlreadyExecutedSearch =
  normalizedSemanticQuery === lastExecutedSemanticQuery &&
  selectedResultLimit === lastExecutedResultLimit;                    // duplicates isSameAsLastExecutedSearch
```

#### Recommended (Good)

Add a single derived selector to `mapHooks.ts`, then `SemanticSearchBar` only needs three keys:

```tsx
// state/mapHooks.ts — one new selector encapsulates the check
const SEARCH_STALENESS_KEYS = [
  "semanticQuery", "lastExecutedSemanticQuery",
  "lastExecutedResultLimit", "limitChoice", "customLimit",
] as const;

export function useIsSearchAlreadyExecuted(): boolean {
  return useEngineMultipleValues(mapEngine, SEARCH_STALENESS_KEYS, (state) => {
    const query = state.semanticQuery.trim();
    if (query.length < 3 || state.lastExecutedResultLimit === null) return false;
    const currentLimit =
      state.limitChoice === "custom" ? Number(state.customLimit) : Number(state.limitChoice);
    return query === state.lastExecutedSemanticQuery && currentLimit === state.lastExecutedResultLimit;
  });
}

// SemanticSearchBar.tsx — 3 state reads, delegates guard to hook
const semanticQuery = useMapValue("semanticQuery");
const semanticLoading = useMapValue("semanticLoading");
const semanticError = useMapValue("semanticError");
const isAlreadyExecutedSearch = useIsSearchAlreadyExecuted();
```

**Why this is better**: `SemanticSearchBar` no longer knows about `lastExecutedResultLimit` or limit-resolution math. The staleness check is defined once in `mapHooks.ts`, alongside the other selectors, and changes to the deduplication logic only touch one place.

---

### ISSUE-03: Limit-resolution validation is written three times

**Severity**: Low
**Principle**: Code Duplication
**Location**: `src/state/mapActions.ts` (`resolveCurrentTopK`), `src/state/useMapUrlSync.ts` (`resolveResultLimit`), `src/components/SemanticSearchBar.tsx` (inline)

The pattern `limitChoice === "custom" ? Number(customLimit) : Number(limitChoice)` and the validity check `Number.isFinite(x) && Number.isInteger(x) && x >= 1` each appear in three files. If the validation rule changes (e.g., adding a maximum), three files need updating.

#### Current (Bad)

```ts
// mapActions.ts
const parsed = Number(customLimit);
if (Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= 1) { ... }

// useMapUrlSync.ts
const parsedLimit = limitChoice === "custom" ? Number(customLimit) : Number(limitChoice);
if (Number.isFinite(parsedLimit) && Number.isInteger(parsedLimit) && parsedLimit >= 1) { ... }

// SemanticSearchBar.tsx
const selectedResultLimit = limitChoice === "custom" ? Number(customLimit) : Number(limitChoice);
const hasValidResultLimit = Number.isFinite(selectedResultLimit) && Number.isInteger(selectedResultLimit) && selectedResultLimit >= 1;
```

#### Recommended (Good)

```ts
// state/mapUrlParams.ts — already the natural home for limit parsing; add one export
export function resolveResultLimit(limitChoice: LimitChoice, customLimit: string): number | null {
  const value = limitChoice === "custom" ? Number(customLimit) : Number(limitChoice);
  return Number.isFinite(value) && Number.isInteger(value) && value >= 1 ? value : null;
}

// mapActions.ts — import and use it
import { resolveResultLimit } from "./mapUrlParams";
function resolveCurrentTopK(): number {
  const resolved = resolveResultLimit(
    mapEngine.getCurrentValue("limitChoice"),
    mapEngine.getCurrentValue("customLimit"),
  );
  return resolved ?? Number(import.meta.env.VITE_SEMANTIC_TOP_K ?? "30");
}

// useMapUrlSync.ts — replace local resolveResultLimit with the import
// SemanticSearchBar.tsx — the ISSUE-02 fix removes the inline copy entirely
```

**Why this is better**: The validity rule is defined once. Callers still handle the `null` case differently (one falls back to an env default, another treats it as invalid) — that divergence is correct; what should be shared is just the parsing logic.

---

### ISSUE-04: `MapPage` mixes domain components with raw layout markup

**Severity**: Low
**Principle**: SLA Violation
**Location**: `src/pages/MapPage.tsx`

`MapPage` composes domain components (`<MapControls>`, `<MapViewer>`, `<PointDetailsPanel>`) but also owns the raw grid/flex structure that positions them. The nested `div > div.grid > main > div` chain is a layout concern, not a domain concern, and mixes abstraction levels.

#### Current (Bad)

```tsx
return (
  <>
    <MapControls />
    <div className="w-full flex-1 min-h-0">                                       {/* layout */}
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
          <div className="p-4 flex-1 min-h-0">
            <MapViewer />                                                           {/* domain */}
          </div>
        </main>
        <PointDetailsPanel />                                                       {/* domain */}
      </div>
    </div>
  </>
);
```

#### Recommended (Good)

```tsx
// components/MapContentArea.tsx — owns the map/details split layout
function MapContentArea() {
  return (
    <div className="w-full flex-1 min-h-0">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
          <div className="p-4 flex-1 min-h-0"><MapViewer /></div>
        </main>
        <PointDetailsPanel />
      </div>
    </div>
  );
}

// pages/MapPage.tsx — domain components only
return (
  <>
    <MapControls />
    <MapContentArea />
  </>
);
```

**Why this is better**: `MapPage` reads as a sentence of domain concepts. Layout changes (breakpoints, panel widths, padding) are isolated to `MapContentArea` and never require touching the page.

---

### ISSUE-05: `NavLink` className callback duplicated three times in `Navbar`

**Severity**: Low
**Principle**: Code Duplication
**Location**: `src/components/Navbar.tsx`

The same `className` callback — combining a base string with active/hover state — is copy-pasted for all three nav links. Adding a fourth route, or changing the active style, means editing the same logic three times.

#### Current (Bad)

```tsx
const linkBase = "h-full inline-flex items-center ...";

<NavLink to="/" className={({ isActive }) => `${linkBase} ${isActive ? "border-white" : "hover:border-white"}`}>Home</NavLink>
<NavLink to="/map" className={({ isActive }) => `${linkBase} ${isActive ? "border-white" : "hover:border-white"}`}>Map</NavLink>
<NavLink to="/about" className={({ isActive }) => `${linkBase} ${isActive ? "border-white" : "hover:border-white"}`}>About</NavLink>
```

#### Recommended (Good)

```tsx
function AppNavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `h-full inline-flex items-center text-white text-sm md:text-base border-b-2 -mb-px transition-colors ${
          isActive ? "border-white" : "border-transparent hover:border-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

<AppNavLink to="/">Home</AppNavLink>
<AppNavLink to="/map">Map</AppNavLink>
<AppNavLink to="/about">About</AppNavLink>
```

**Why this is better**: The active style is defined once; adding a new route is one line.

---

### ISSUE-06: `buildMapUrlState` is exported but never used

**Severity**: Low
**Principle**: Code Duplication / Dead Code
**Location**: `src/state/mapUrlParams.ts`

`buildMapUrlState` is exported from `mapUrlParams.ts` but is not imported anywhere in the codebase. `useMapUrlSync.ts` builds its state→URL params inline (lines 97–119) rather than calling this function. Dead exports mislead readers into thinking the function is part of the module's public contract.

#### Current (Bad)

```ts
// mapUrlParams.ts — exported, but zero import sites in the project
export function buildMapUrlState(params: {
  semanticQuery: string;
  limitChoice: LimitChoice;
  customLimit: string;
  selectedPointId: string | null;
}): URLSearchParams { ... }
```

#### Recommended (Good)

Delete `buildMapUrlState`. If `useMapUrlSync.ts` is ever refactored to use a builder, re-introduce it then — with inputs matched to what the hook actually produces (`lastExecutedSemanticQuery: string`, `lastExecutedResultLimit: number | null`), not the current form-field shape.

**Why this is better**: Removes a function that silently diverged from the actual URL serialisation used in production, preventing future confusion about which serialiser is authoritative.

---

## What Is Working Well

Every component was examined. The following are well-structured — no issues found:

- **`SemanticNavigatorApi` + `apiClient.ts`**: Textbook API abstraction. A class with constructor injection (`baseUrl`), instantiated as a singleton. `mapActions.ts` is the only consumer. Swapping the backend requires changing only this class.
- **`mapEngine` / `mapActions` / `mapHooks` layering**: Engine → actions → hooks → components. No component or hook calls the API directly; everything goes through the action layer.
- **`MapControls`**: Clean orchestrator — composes `<ResultLimitSelector>` and `<SemanticSearchBar>` with no logic of its own.
- **`ResultLimitSelector`**: Well-scoped. Handles the dropdown, conditional custom input, and the "showing X of Y" counter — all related to the same control, at the same abstraction level. No unnecessary state reads.
- **`MapViewer`**: A clean state-machine renderer — loading / error / content, each at the same level, delegating the happy path to `<MapPlot>`.
- **`PointDetailsContent`**: All sections render at a consistent abstraction level, using the local `<TagsSection>` helper for structured content. The local `TagsSection` component is a good extraction that removes the repeated label/empty-state pattern.
- **`PointDetailsPanelMobile`**: A well-designed pure presentation component. Props are minimal (`open`, `onClose`, `children`) and the callback is correctly typed as `() => void`.
- **`useMapUrlSync`**: Non-trivial bidirectional sync implemented correctly. Using `mapEngine.getCurrentValue()` in the URL→state effect (rather than reactive subscriptions) avoids stale-closure bugs.
- **`mapUrlParams.ts` (`parseMapUrlState`)**: Parsing logic is properly isolated from the hook. Functions are pure and independently testable.
- **`useSemanticAutoRefresh`**: Correctly debounces only custom-limit keystrokes while firing immediately for preset-limit changes. The asymmetric debouncing is intentional and correct.

---

## Recommendations Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | ISSUE-01: Page-composed layout instead of router Outlet | Medium | Medium |
| 2 | ISSUE-02: `SemanticSearchBar` state over-subscription and duplicated guard | Low | Medium |
| 3 | ISSUE-03: Extract shared limit-resolution utility | Low | Low |
| 4 | ISSUE-04: Extract `MapContentArea` from `MapPage` | Low | Low |
| 5 | ISSUE-05: Extract `AppNavLink` in `Navbar` | Low | Low |
| 6 | ISSUE-06: Delete `buildMapUrlState` dead export | Low | Low |

---

## Architecture Health Score

| Criterion | Score (1–5) | Notes |
|-----------|-------------|-------|
| Single Level of Abstraction | 4 | `MapPage` mixes layout with domain; all other components are consistent |
| Component API Design | 4 | `SemanticSearchBar` reads too many keys; all other APIs are clean and minimal |
| Data Flow Clarity | 4 | Engine → actions → hooks → components is solid; `SemanticSearchBar` duplicates the action-layer guard |
| API Abstraction Layer | 5 | `SemanticNavigatorApi` class with constructor injection; `mapActions` is the only consumer |
| App Layout / Shell | 3 | Router-level Outlet pattern; pages are not self-contained |
| Code Duplication | 3 | Limit-resolution logic in 3 places; `buildMapUrlState` is dead; NavLink pattern repeated |
| Composition Patterns | 4 | `children` used well; `memo` applied consistently; `AppNavLink` is a natural missing local component |
| **Overall** | **3.9 / 5** | Strong foundation with a handful of low-effort improvements available |
