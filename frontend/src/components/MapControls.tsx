import { memo } from "react";
import ResultLimitSelector from "./ResultLimitSelector";
import SemanticSearchBar from "./SemanticSearchBar";

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

export default memo(MapControls);
