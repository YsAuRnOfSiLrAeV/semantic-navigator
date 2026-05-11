import { memo } from "react";
import { DatasetSelector } from "./DatasetSelector";
import { ResultLimitSelector } from "./ResultLimitSelector";
import { SemanticSearchBar } from "./SemanticSearchBar";

export const MapControls = memo(function MapControls() {
  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <DatasetSelector />
        <ResultLimitSelector />
        <SemanticSearchBar />
      </div>
    </div>
  );
})
