import { memo } from "react";
import { DatasetLabels, EnabledDatasetIds } from "../../constants";
import type { DatasetId } from "../../types";
import { setSelectedDatasetId } from "../../state/actions/mapActions";
import { useMapValue } from "../../state/selectors/mapSelectors";

export const DatasetSelector = memo(function DatasetSelector() {
  const selectedDatasetId = useMapValue("selectedDatasetId");

  return (
    <label className="text-sm md:text-base text-zinc-300 flex items-center gap-3">
      <span className="font-medium">Dataset</span>
      <select
        className="text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
        value={selectedDatasetId}
        onChange={(event) => setSelectedDatasetId(event.target.value as DatasetId)}
      >
        {EnabledDatasetIds.map((datasetId) => (
          <option key={datasetId} value={datasetId}>
            {DatasetLabels[datasetId]}
          </option>
        ))}
      </select>
    </label>
  );
});
