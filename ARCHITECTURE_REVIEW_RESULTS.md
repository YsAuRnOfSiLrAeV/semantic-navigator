# Architecture Review Results

> Analyzed on: 2026-03-23
> Project: semantic-navigator (frontend)
> Total components analyzed: 9 (Navbar, MapViewer, MapPlot, MapControls, PointDetailsPanel, PointDetailsContent, TagsSection, PointDetailsPanelMobile + 3 pages)
> Issues found: 4

## Summary

The project is well-architected for its scope. The API abstraction layer (`SemanticNavigatorApi` class), state management separation (engine / actions / hooks), and URL sync isolation are all solid. The main finding is a router-level layout pattern (`<Outlet />`) that makes pages incomplete fragments and ties the shell to React Router — fixing this unlocks self-contained, framework-agnostic pages. Two lower-severity SLA concerns exist: `MapPage` mixes domain components with a raw grid wrapper, and `MapControls` handles two distinct concerns in a single component.

---

## Issues

### ISSUE-1: Layout is coupled to the router via `<Outlet />`

**Severity**: Medium
**Principle**: Missing Layout
**Location**: `frontend/src/App.tsx`, `frontend/src/layouts/RootLayout.tsx`

`RootLayout` uses React Router's `<Outlet />` as its content slot, and `App.tsx` wraps all routes inside `<Route element={<RootLayout />}>`. This makes every page an incomplete fragment — a page only renders correctly when nested inside a React Router outlet. If routing changes (e.g. moving to Next.js, or adding an unauthenticated route that skips the navbar), pages can't control their own shell, and layout changes require touching the router.

#### Current (Bad)

```tsx
// App.tsx — layout is a router concern
<Routes>
  <Route element={<RootLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/map" element={<MapPage />} />
    <Route path="/about" element={<AboutPage />} />
  </Route>
</Routes>

// RootLayout.tsx — coupled to React Router
export default function RootLayout() {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <Outlet />  {/* pages are slots, not self-contained */}
    </div>
  );
}
```

#### Recommended (Good)

```tsx
// components/AppLayout.tsx — no router dependency
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      {children}
    </div>
  );
}

// pages/MapPage.tsx — self-contained, complete page
export default function MapPage() {
  useMapUrlSync();
  usePointsLoader();
  useSemanticAutoRefresh();
  return (
    <AppLayout>
      <MapControls />
      {/* ... rest of page */}
    </AppLayout>
  );
}

// App.tsx — routes are flat, no layout nesting
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/map" element={<MapPage />} />
  <Route path="/about" element={<AboutPage />} />
</Routes>
```

**Why this is better**: Each page is a complete, self-contained unit. Reading a page file shows everything it renders including its shell, and pages can individually opt out of or customize the layout without touching the router.

---

### ISSUE-2: `MapPage` mixes domain components with raw layout HTML

**Severity**: Low
**Principle**: SLA Violation
**Location**: `frontend/src/pages/MapPage.tsx`

`MapPage` composes named domain components (`MapControls`, `MapViewer`, `PointDetailsPanel`) at a high abstraction level, but the viewer/panel split is implemented as three layers of unnamed divs directly in the page. You can't describe what `MapPage` renders in a single sentence using only named children — the responsive grid wrapper is anonymous.

#### Current (Bad)

```tsx
export default function MapPage() {
  // ...hooks
  return (
    <>
      <MapControls />
      <div className="w-full flex-1 min-h-0">                            {/* unnamed */}
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">  {/* unnamed */}
          <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
            <div className="p-4 flex-1 min-h-0">                         {/* unnamed */}
              <MapViewer />
            </div>
          </main>
          <PointDetailsPanel />
        </div>
      </div>
    </>
  );
}
```

#### Recommended (Good)

```tsx
// components/MapWorkspace.tsx — owns the viewer/panel responsive layout
function MapWorkspace({ viewer, panel }: { viewer: ReactNode; panel: ReactNode }) {
  return (
    <div className="w-full flex-1 min-h-0">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
          <div className="p-4 flex-1 min-h-0">{viewer}</div>
        </main>
        {panel}
      </div>
    </div>
  );
}

// pages/MapPage.tsx — reads like a sentence
export default function MapPage() {
  // ...hooks
  return (
    <AppLayout>
      <MapControls />
      <MapWorkspace viewer={<MapViewer />} panel={<PointDetailsPanel />} />
    </AppLayout>
  );
}
```

**Why this is better**: `MapPage` now reads as a declarative list of its domain concepts. The responsive layout logic is named and locatable, and changes to the grid happen in one place.

---

### ISSUE-3: `MapControls` handles two distinct responsibilities

**Severity**: Low
**Principle**: SLA Violation
**Location**: `frontend/src/components/MapControls.tsx`

`MapControls` renders both the result-limit selector (dropdown + optional custom input + point count) and the semantic search bar (query input + button + error). These are two separate features with different state, different user intent, and different failure modes. The component makes 8 `useMapValue()` calls — 4 for limits, 4 for search — and describing what it renders requires naming both concerns.

#### Current (Bad)

```tsx
function MapControls() {
  // 4 calls for limits
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
  const lastExecutedResultLimit = useMapValue("lastExecutedResultLimit");
  const pointsCount = useMapValue("points").length;

  // 4 calls for search
  const semanticQuery = useMapValue("semanticQuery");
  const semanticLoading = useMapValue("semanticLoading");
  const semanticError = useMapValue("semanticError");
  const lastExecutedSemanticQuery = useMapValue("lastExecutedSemanticQuery");

  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <label>  {/* result limit dropdown */} </label>
        {/* custom limit input */}
        <div>{/* point count */}</div>
        <form>  {/* semantic search form */} </form>
      </div>
      {semanticError ? <div>...</div> : null}
    </div>
  );
}
```

#### Recommended (Good)

```tsx
// components/ResultLimitSelector.tsx — owns limit dropdown, custom input, point count
function ResultLimitSelector() {
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
  const pointsCount = useMapValue("points").length;
  // ...
}

// components/SemanticSearchBar.tsx — owns query input, button, error display
function SemanticSearchBar() {
  const semanticQuery = useMapValue("semanticQuery");
  const semanticLoading = useMapValue("semanticLoading");
  const semanticError = useMapValue("semanticError");
  const lastExecutedSemanticQuery = useMapValue("lastExecutedSemanticQuery");
  const lastExecutedResultLimit = useMapValue("lastExecutedResultLimit");
  // ...
}

// components/MapControls.tsx — composes two named features
function MapControls() {
  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <ResultLimitSelector />
        <SemanticSearchBar />
      </div>
    </div>
  );
}
```

**Why this is better**: Each sub-component has a single clear responsibility and a focused set of state subscriptions. `MapControls` becomes a pure layout composer.

---

### ISSUE-4: `PointDetailsContent` has unnamed inline sections alongside the named `TagsSection`

**Severity**: Low
**Principle**: SLA Violation
**Location**: `frontend/src/components/PointDetailsPanel.tsx` (lines 24–122)

`PointDetailsContent` correctly uses `TagsSection` for categories and review tags, but the image, metadata badges (destination, rating), name, and description are raw inline HTML at the same level. The abstraction is inconsistent: some sections are named and some are anonymous divs. The image and metadata badges are distinct enough UI pieces to warrant names.

#### Current (Bad)

```tsx
function PointDetailsContent() {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5"> {/* unnamed image */}
        <img src={selected.picture} ... />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-200"> {/* unnamed badges */}
        <span className="rounded-full border border-white/20 px-2.5 py-1">
          {selected.destination || "Unknown destination"}
        </span>
        <span ...>Rating: {selected.rating.toFixed(1)}</span>
      </div>

      <div className="text-base font-semibold leading-snug">{selected.name}</div>

      <TagsSection label="Categories" ...>...</TagsSection>   {/* named ✓ */}
      <TagsSection label="Review Tags" ...>...</TagsSection>  {/* named ✓ */}
    </div>
  );
}
```

#### Recommended (Good)

```tsx
function PointHero({ point }: { point: TravelPoint }) {
  if (!point.picture) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <img src={point.picture} alt={point.name} className="h-44 w-full object-cover" loading="lazy" />
    </div>
  );
}

function PointMetaBadges({ point }: { point: TravelPoint }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-200">
      <span className="rounded-full border border-white/20 px-2.5 py-1">
        {point.destination || "Unknown destination"}
      </span>
      <span className="rounded-full border border-white/20 px-2.5 py-1">
        Rating: {Number.isFinite(point.rating) ? point.rating.toFixed(1) : "n/a"}
      </span>
    </div>
  );
}

function PointDetailsContent() {
  const selected = useSelectedPoint();
  // ...
  return (
    <div className="space-y-5">
      <PointHero point={selected} />
      <PointMetaBadges point={selected} />
      <div className="text-base font-semibold leading-snug">{selected.name}</div>
      <div className="text-sm text-zinc-200/90 leading-relaxed">{selected.description}</div>
      <TagsSection label="Categories" ...>...</TagsSection>
      <TagsSection label="Review Tags" ...>...</TagsSection>
      {/* ... link */}
    </div>
  );
}
```

**Why this is better**: Every visual section in `PointDetailsContent` is now a named component, making the composition self-documenting and each piece independently modifiable.

---

## What's Working Well

- **API abstraction layer**: `SemanticNavigatorApi` is a proper class with constructor injection. Actions call the API through the singleton; no component or hook ever imports `fetch` directly. Swapping the backend requires touching only this class.
- **State layering**: The engine / actions / hooks separation is clean. `mapActions.ts` owns all state mutation logic; hooks are thin wrappers for React subscription. `useMapUrlSync` is well-isolated in its own file.
- **`PointDetailsPanel` structure**: The file correctly defines `TagsSection`, `PointDetailsContent`, and `PointDetailsPanel` as three distinct components. `PointDetailsContent` is reused for both the desktop aside and mobile drawer without any duplication.
- **`PointDetailsPanelMobile`**: Clean props-based API (`open`, `onClose`, `children`) with no global state access — the right design for a reusable UI primitive.
- **No prop drilling**: Every component subscribes to state directly via hooks. No intermediate components pass unused props.
- **No code duplication**: `TagsSection` was extracted at exactly the right moment — when the pattern appeared twice.

---

## Recommendations Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | ISSUE-1: Layout via `<Outlet />` → per-page `AppLayout` | Low | Medium |
| 2 | ISSUE-2: Extract `MapWorkspace` from `MapPage` | Low | Low |
| 3 | ISSUE-3: Split `MapControls` into `ResultLimitSelector` + `SemanticSearchBar` | Low | Low |
| 4 | ISSUE-4: Extract `PointHero` and `PointMetaBadges` from `PointDetailsContent` | Low | Low |

---

## Architecture Health Score

| Criterion | Score (1–5) | Notes |
|-----------|-------------|-------|
| Single Level of Abstraction | 3.5 | Localized mixing in `MapPage`, `MapControls`, and `PointDetailsContent`; `PointDetailsPanel` itself is well-structured |
| Component API Design | 3.5 | Most components have no props and read from global state (valid pattern); `PointDetailsPanelMobile` shows the cleaner alternative for reusable pieces |
| Data Flow Clarity | 5 | Engine → actions → hooks → components is consistently enforced; URL sync cleanly isolated |
| API Abstraction Layer | 5 | `SemanticNavigatorApi` class, singleton, no leakage into hooks or components |
| App Layout / Shell | 2.5 | Outlet-based layout makes pages router-dependent fragments |
| Code Duplication | 5 | Near-zero duplication; `TagsSection` extracted at exactly the right time |
| Composition Patterns | 4 | `children` used well in `PointDetailsPanelMobile`; `PointDetailsContent` reuse is clean |
| **Overall** | **4.1** | Solid architecture for this scope. The API layer and state management are particularly strong. The main investment is the layout pattern; the SLA issues are all low-effort fixes. |
