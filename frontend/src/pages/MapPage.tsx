import { MapControls, MapPlot, PointDetailsPanel } from "../components";
import { useMapValue, usePointsLoader } from "../state/mapHooks";

export default function MapPage() {
  usePointsLoader();
  const loading = useMapValue("loading");
  const error = useMapValue("error");

  return (
    <>
      <MapControls/>

      <div className="w-full flex-1 min-h-0">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
            <div className="p-4 flex-1 min-h-0">
              <div className="h-full rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-base text-zinc-300">
                    Loading points...
                  </div>
                ) : error ? (
                  <div className="p-4 text-base text-red-300">{error}</div>
                ) : (
                  <MapPlot/>
                )}
              </div>
            </div>
          </main>

          <PointDetailsPanel/>
        </div>
      </div>
    </>
  );
}

