import { memo } from "react";
import { useMapValue } from "../state/mapHooks";
import MapPlot from "./MapPlot";

function MapViewer() {
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

export default memo(MapViewer);