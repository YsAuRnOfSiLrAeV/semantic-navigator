# Architecture Review Results

> Analyzed on: 2026-03-21
> Project: semantic-navigator / frontend
> Total components analyzed: 10
> Issues found: 5

## Summary

This is a thoughtfully structured project with a clean API abstraction layer, proper state/action/hook layering, and several well-designed components. The main architectural concerns are: the layout is router-coupled via `<Outlet />` rather than composed inside each page, and a few components mix abstraction levels by rendering inline markup alongside named components. These are straightforward fixes on an otherwise solid foundation.

---

## Issues

### ISSUE-01: Layout coupled to React Router via `<Outlet />`

**Severity**: Medium
**Principle**: Missing Layout
**Location**: `src/layouts/RootLayout.tsx`, `src/App.tsx`

`RootLayout` uses React Router's `<Outlet />`, making each page an incomplete fragment that only works within the router's outlet mechanism. This couples the shell to React Router specifically — if the routing library changes, or a page needs to customize the shell (different title, extra sidebar), the current structure makes that awkward. Pages are not self-contained.

#### Current (Bad)

```tsx
// App.tsx — layout is controlled by router nesting
<Route element={<RootLayout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/map" element={<MapPage />} />
  <Route path="/about" element={<AboutPage />} />
</Route>

// RootLayout.tsx — pages render as fragments into <Outlet />
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
// src/components/AppLayout.tsx — owns all shell markup
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      {children}
    </div>
  );
}

// src/pages/MapPage.tsx — self-contained, complete page
export default function MapPage() {
  usePointsLoader();
  return (
    <AppLayout>
      <MapControls />
      {/* ... */}
    </AppLayout>
  );
}

// src/App.tsx — flat routes, no layout wrapper
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}
```

**Why this is better**: Each page is a complete, self-contained unit — reading the file shows you everything it renders, including its shell, with no dependency on React Router's outlet mechanism. No router changes are needed if the shell needs to evolve.

---

### ISSUE-02: `MapPage` mixes named components with inline loading/error markup

**Severity**: Medium
**Principle**: SLA Violation
**Location**: `src/pages/MapPage.tsx`

`MapPage` renders `<MapControls />` and `<PointDetailsPanel />` at a named-component abstraction level, but then drops into raw `<div>` elements for the loading and error states inside the map area. The page should describe its layout exclusively in terms of named components.

#### Current (Bad)

```tsx
// MapPage.tsx — named components mixed with raw divs for loading/error
<div className="h-full rounded-lg border border-white/10 bg-white/5 overflow-hidden">
  {loading ? (
    <div className="h-full flex items-center justify-center text-base text-zinc-300">
      Loading points...
    </div>
  ) : error ? (
    <div className="p-4 text-base text-red-300">{error}</div>
  ) : (
    <MapPlot />
  )}
</div>
```

#### Recommended (Good)

```tsx
// src/components/MapViewer.tsx — owns the map area including its loading/error states
export default function MapViewer() {
  const loading = useMapValue("loading");
  const error = useMapValue("error");
  return (
    <div className="h-full rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      {loading ? (
        <div className="h-full flex items-center justify-center text-base text-zinc-300">
          Loading points...
        </div>
      ) : error ? (
        <div className="p-4 text-base text-red-300">{error}</div>
      ) : (
        <MapPlot />
      )}
    </div>
  );
}

// src/pages/MapPage.tsx — reads as a sentence of named components
export default function MapPage() {
  usePointsLoader();
  return (
    <>
      <MapControls />
      <div className="w-full flex-1 min-h-0">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
            <div className="p-4 flex-1 min-h-0">
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

**Why this is better**: `MapPage` now reads as a composition of named domain components only, and loading/error display logic is co-located in the component that owns the map area.

---

### ISSUE-03: `MapControls` handles two distinct concerns without sub-components

**Severity**: Medium
**Principle**: SLA Violation
**Location**: `src/components/MapControls.tsx`

`MapControls` manages both the point-limit selection UI and the semantic-search UI as a flat list of elements, consuming 6 separate state values. The two concerns are visually and functionally distinct and should be named sub-components, making the controls bar self-describe its composition.

#### Current (Bad)

```tsx
function MapControls() {
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
  const pointsCount = useMapValue("points").length;
  const semanticQuery = useMapValue("semanticQuery");
  const semanticLoading = useMapValue("semanticLoading");
  const semanticError = useMapValue("semanticError");

  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <label>...limit select...</label>
        {limitChoice === "custom" ? <label>...custom input...</label> : null}
        <div>Showing {pointsCount} points</div>
        <div className="flex flex-1 ...">
          <input ... />
          <button>Find closest</button>
        </div>
      </div>
      {semanticError ? <div>{semanticError}</div> : null}
    </div>
  );
}
```

#### Recommended (Good)

```tsx
// Each sub-component owns exactly the state it needs
function PointsLimitSelector() {
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
  const pointsCount = useMapValue("points").length;
  // ...limit select + custom input + count display
}

function SemanticSearchBar() {
  const semanticQuery = useMapValue("semanticQuery");
  const semanticLoading = useMapValue("semanticLoading");
  const semanticError = useMapValue("semanticError");
  // ...input + button + error message
}

function MapControls() {
  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <PointsLimitSelector />
        <SemanticSearchBar />
      </div>
    </div>
  );
}
```

**Why this is better**: `MapControls` describes its composition in one sentence ("a row with a limit selector and a semantic search bar"), and each sub-component owns exactly the state it needs.

---

### ISSUE-04: `HomePage` renders all sections as flat raw markup

**Severity**: Low
**Principle**: SLA Violation
**Location**: `src/pages/HomePage.tsx`

`HomePage` renders its content as a flat sequence of raw HTML elements. The status banner, how-to steps, and CTA row are distinct named concerns that deserve component names, making the page body read as a description of its structure rather than a wall of markup.

#### Current (Bad)

```tsx
export default function HomePage() {
  return (
    <main className="p-6 md:p-10 text-zinc-100 space-y-6">
      <h1 ...>Travel Semantic Navigator</h1>
      <p ...>An interactive app...</p>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
        Current status: the demo still uses a news dataset as a technical base.
      </div>
      <div className="space-y-2 text-zinc-300">
        <p>How to use:</p>
        <p>1. Open the map and choose the number of points.</p>
        {/* ... */}
      </div>
      <div className="flex gap-3">
        <Link to="/map" ...>Open Map</Link>
        <Link to="/about" ...>About Project</Link>
      </div>
    </main>
  );
}
```

#### Recommended (Good)

```tsx
function StatusBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
      {children}
    </div>
  );
}

function HowToGuide() {
  return (
    <div className="space-y-2 text-zinc-300">
      <p>How to use:</p>
      <p>1. Open the map and choose the number of points.</p>
      <p>2. Click a point to view details.</p>
      <p>3. Open the source link for more context.</p>
    </div>
  );
}

function HomeActions() {
  return (
    <div className="flex gap-3">
      <Link to="/map" className="px-4 py-2 rounded border border-white/20 hover:border-white/40">Open Map</Link>
      <Link to="/about" className="px-4 py-2 rounded border border-white/20 hover:border-white/40">About Project</Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="p-6 md:p-10 text-zinc-100 space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold">Travel Semantic Navigator</h1>
      <p className="text-zinc-300 max-w-3xl">An interactive app for semantic place discovery...</p>
      <StatusBanner>Current status: the demo still uses a news dataset as a technical base.</StatusBanner>
      <HowToGuide />
      <HomeActions />
    </main>
  );
}
```

**Why this is better**: `HomePage` now reads as a sentence — a header, description, status banner, how-to guide, and actions — and each named piece documents its own purpose.

---

### ISSUE-05: `AboutPage` repeats the same section pattern four times without a shared primitive

**Severity**: Low
**Principle**: SLA Violation / Code Duplication
**Location**: `src/pages/AboutPage.tsx`

`AboutPage` has four sections (Project Goal, Current Stack, Roadmap, AI Usage), each with identical structure: a heading + body text rendered as a raw `<section>` block. Alongside ISSUE-04, this signals a missing `InfoSection` primitive that both pages could share.

#### Current (Bad)

```tsx
// Same structure repeated 4 times
<section className="space-y-2 text-zinc-300">
  <h2 className="text-xl text-zinc-100">Project Goal</h2>
  <p>Build a solid semester-long foundation...</p>
</section>

<section className="space-y-2 text-zinc-300">
  <h2 className="text-xl text-zinc-100">Current Stack</h2>
  <p>Frontend: React + TypeScript...</p>
  <p>Backend: FastAPI...</p>
</section>
```

#### Recommended (Good)

```tsx
// Reusable across HomePage and AboutPage
function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 text-zinc-300">
      <h2 className="text-xl text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="p-6 md:p-10 text-zinc-100 space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold">About</h1>
      <InfoSection title="Project Goal">
        <p>Build a solid semester-long foundation...</p>
      </InfoSection>
      <InfoSection title="Current Stack">
        <p>Frontend: React + TypeScript + React Router + Plotly.</p>
        <p>Backend: FastAPI + Sentence Transformers + UMAP + KMeans.</p>
      </InfoSection>
      {/* ... */}
    </main>
  );
}
```

**Why this is better**: The repeated section pattern is named and centralized — both pages can share the same primitive, and adding a new section is one `<InfoSection>` instead of four lines of markup.

---

## Well-Structured Components

These components were reviewed and are clean — no issues found:

- **`Navbar.tsx`**: Single job, clean `NavLink` composition, no abstraction mixing.
- **`MapPlot.tsx`**: Focused on the Plotly visualization; `clusterColor` helper cleanly extracted; `memo` and `useMemo` used correctly.
- **`PointDetailsPanel.tsx`**: Excellent sub-component extraction (`TagsSection`, `PointDetailsContent`); the responsive split between desktop `<aside>` and mobile drawer is clean. This is the best-structured component in the project.
- **`PointDetailsPanelMobile.tsx`**: Simple, focused drawer component with a clear props API (`open`, `onClose`, `children`).
- **`SemanticNavigatorApi.ts`**: Proper class-based API layer with constructor injection of `baseUrl` and `AbortSignal` support — textbook correct pattern.
- **State layering** (`mapEngine` / `mapHooks` / `mapActions`): The three-file split between state definition, React bindings, and mutations/async thunks is clean and well-organized. Hooks are thin wrappers; actions are the only place that touch external APIs.

---

## Recommendations Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | ISSUE-01: Layout coupled to React Router Outlet | Medium | Medium |
| 2 | ISSUE-02: `MapPage` inline loading/error markup | Low | Medium |
| 3 | ISSUE-03: `MapControls` mixes two concerns | Low | Medium |
| 4 | ISSUE-04: `HomePage` flat raw section markup | Low | Low |
| 5 | ISSUE-05: `AboutPage` duplicated section pattern | Low | Low |

---

## Architecture Health Score

| Criterion | Score (1–5) | Notes |
|-----------|-------------|-------|
| Single Level of Abstraction | 3 | Pages and `MapControls` mix levels; `PointDetailsPanel` is exemplary |
| Component API Design | 5 | Props and callbacks are well-typed and minimal throughout |
| Data Flow Clarity | 5 | Clean engine → hooks → components pipeline; zero prop drilling |
| API Abstraction Layer | 5 | `SemanticNavigatorApi` class with constructor injection is exactly right |
| App Layout / Shell | 3 | `RootLayout`/`Outlet` couples shell to router; no per-page customization path |
| Code Duplication | 4 | Minor duplication in page section patterns only |
| Composition Patterns | 4 | Good use of `children` and `memo`; strong sub-component extraction in `PointDetailsPanel` |
| **Overall** | **4.1 / 5** | Solid foundation with well-separated concerns; all fixes are low-effort |
