import { useEffect, useMemo, useState } from "react";
import { MapPlot } from "./components/MapPlot";
import { SidePanel } from "./components/SidePanel";

import { fetchPoints, type Point } from "./api/api";

type LimitChoice = "500" | "1000" | "3000" | "5000" | "custom";

export default function App() {
  // Mobile/tablet drawer open state
  const [open, setOpen] = useState(false);
  // Points currently loaded from backend
  const [points, setPoints] = useState<Point[]>([]);
  // Which point is currently selected - used to render details panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI control for how many points to request (500/1000/3000/5000/custom)
  const [limitChoice, setLimitChoice] = useState<LimitChoice>("5000");
  const [customLimit, setCustomLimit] = useState<string>("");

  // Fetch points from backend whenever the requested limit changes.
  // Uses AbortController to cancel an in-flight request,
  // and setTimeout to delay the request until the user stops typing.
  // Cleanup aborts the request and clears the pending timer.
  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | null = null;

    const run = async (limit: number | undefined) => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPoints(limit, controller.signal);
        setPoints(data);

        // keep selection if still exists, otherwise pick first
        setSelectedId((prev) => {
          if (prev && data.some((p) => p.id === prev)) return prev;
          return data[0]?.id ?? null;
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    // if custom limit is chosen, wait 450ms before running the query
    if (limitChoice === "custom") {
      timeoutId = window.setTimeout(() => {
        const n = Number(customLimit);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
          setError("Custom limit must be a positive integer.");
          return;
        }
        void run(n);
      }, 450);
    } else {
      void run(Number(limitChoice));
    }

    return () => {
      controller.abort();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [limitChoice, customLimit]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return points.find((p) => p.id === selectedId) ?? null;
  }, [points, selectedId]);

  const details = selected ? (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-zinc-400">{selected.category}</div>
      </div>

      <div className="text-base font-semibold leading-snug">{selected.headline}</div>
      <div className="text-sm text-zinc-200/90 leading-relaxed">
        {selected.short_description || <span className="text-zinc-400">No description.</span>}
      </div>

      <a
        className="text-sm underline text-zinc-200"
        href={selected.link}
        target="_blank"
        rel="noreferrer"
      >
        Open original
      </a>
    </div>
  ) : (
    <div className="text-sm text-zinc-400">Click a point to see details.</div>
  );

  return (
    <>
      <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
        <div className="border-b border-white/10">
          <div className="h-16 px-4 flex items-center">
            <div className="text-lg md:text-xl font-semibold tracking-wide">
              Semantic Navigator
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 px-4 py-3 flex flex-wrap items-center gap-4">
          <label className="text-sm md:text-base text-zinc-300 flex items-center gap-3">
            <span className="font-medium">Points</span>
            <select
              className="text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
              value={limitChoice}
              onChange={(e) => setLimitChoice(e.target.value as LimitChoice)}
            >
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="3000">3000</option>
              <option value="5000">5000</option>
              <option value="custom">Custom…</option>
            </select>
          </label>

          {limitChoice === "custom" ? (
            <label className="text-sm md:text-base text-zinc-300 flex items-center gap-3">
              <span className="font-medium">N</span>
              <input
                className="w-32 text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="e.g. 222"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
              />
            </label>
          ) : null}

          <div className="text-sm md:text-base text-zinc-400">
            Showing {points.length} point{points.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="w-full flex-1 min-h-0">
          <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
            <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
              <div className="p-4 flex-1 min-h-0">
                <div className="h-full rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                  {loading ? (
                    <div className="h-full flex items-center justify-center text-base text-zinc-300">
                      Loading points…
                    </div>
                  ) : error ? (
                    <div className="p-4 text-base text-red-300">{error}</div>
                  ) : (
                    <MapPlot
                      points={points}
                      onSelect={(id) => {
                        setSelectedId(id);
                        setOpen(true); // opens mobile drawer, desktop panel updates automatically
                      }}
                    />
                  )}
                </div>
              </div>
            </main>

            <aside className="hidden lg:block min-h-0">
              <div className="p-6 h-full overflow-auto">{details}</div>
            </aside>
          </div>
        </div>
      </div>

      <SidePanel open={open} onClose={() => setOpen(false)}>
        {details}
      </SidePanel>
    </>
  );
}
