import { useMemo } from "react";
import { MapControls, MapPlot, PointDetailsPanel } from "../components";
import { useSemanticNavigator } from "../hooks/useSemanticNavigator";

export default function MapPage() {
  const {
    state,
    setLimitChoice,
    setCustomLimit,
    selectPoint,
    closeDetails,
  } = useSemanticNavigator();

  const selected = useMemo(() => {
    if (!state.selectedId) return null;
    return state.points.find((point) => point.id === state.selectedId) ?? null;
  }, [state.points, state.selectedId]);

  return (
    <>
      <MapControls
        limitChoice={state.limitChoice}
        customLimit={state.customLimit}
        pointsCount={state.points.length}
        onLimitChoiceChange={setLimitChoice}
        onCustomLimitChange={setCustomLimit}
      />

      <div className="w-full flex-1 min-h-0">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
            <div className="p-4 flex-1 min-h-0">
              <div className="h-full rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                {state.loading ? (
                  <div className="h-full flex items-center justify-center text-base text-zinc-300">
                    Loading points...
                  </div>
                ) : state.error ? (
                  <div className="p-4 text-base text-red-300">{state.error}</div>
                ) : (
                  <MapPlot
                    points={state.points}
                    onSelect={(id) => {
    console.log("plot id:", id);
    selectPoint(id);
  }}

                  />
                )}
              </div>
            </div>
          </main>

          <PointDetailsPanel
            selected={selected}
            open={state.open}
            onClose={closeDetails}
          />
        </div>
      </div>
    </>
  );
}
