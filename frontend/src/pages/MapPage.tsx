import { MapControls, PointDetailsPanel } from "../components";
import MapViewer from "../components/MapViewer";
import { usePointsLoader, useSemanticAutoRefresh } from "../state/mapHooks";
import { useMapUrlSync } from "../state/useMapUrlSync";

export default function MapPage() {
  useMapUrlSync();
  usePointsLoader();
  useSemanticAutoRefresh();
  return (
    <>
      <MapControls/>
      <div className="w-full flex-1 min-h-0">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
            <div className="p-4 flex-1 min-h-0">
              <MapViewer />
            </div>
          </main>
          <PointDetailsPanel/>
        </div>
      </div>
    </>
  );
}

