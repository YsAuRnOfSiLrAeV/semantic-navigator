import type { LimitChoice } from "../types";
import { LimitChoices } from "../constants";
import { FormEvent, memo, useCallback } from "react";
import { useMapValue } from "../state/mapHooks";
import { runSemanticSearch, setCustomLimit, setLimitChoice, setSemanticQuery } from "../state/mapActions";

function MapControls() {
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
  const pointsCount = useMapValue("points").length;

  const semanticQuery = useMapValue("semanticQuery");
  const semanticLoading = useMapValue("semanticLoading");
  const semanticError = useMapValue("semanticError");

  const totalPlacesCount = useMapValue("totalPlacesCount");

  const lastExecutedSemanticQuery = useMapValue("lastExecutedSemanticQuery");
  const lastExecutedResultLimit = useMapValue("lastExecutedResultLimit");

  const normalizedSemanticQuery = semanticQuery.trim();
  const selectedResultLimit =
    limitChoice === "custom" ? Number(customLimit) : Number(limitChoice);

  const hasValidResultLimit =
    Number.isFinite(selectedResultLimit) &&
    Number.isInteger(selectedResultLimit) &&
    selectedResultLimit >= 1;

  const isAlreadyExecutedSearch =
    normalizedSemanticQuery.length >= 3 &&
    hasValidResultLimit &&
    normalizedSemanticQuery === lastExecutedSemanticQuery &&
    selectedResultLimit === lastExecutedResultLimit;

  const handleSemanticSearchSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSemanticSearch();
  }, []);

  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm md:text-base text-zinc-300 flex items-center gap-3">
          <span className="font-medium">Results</span>
          <select
            className="text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
            value={limitChoice}
            onChange={(e) => setLimitChoice(e.target.value as LimitChoice)}
          >
            {Object.entries(LimitChoices).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>

        {limitChoice === "custom" ? (
          <label className="text-sm md:text-base text-zinc-300 flex items-center gap-3">
            <span className="font-medium">Top K</span>
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
          Showing {pointsCount.toLocaleString()} of {(totalPlacesCount ?? pointsCount).toLocaleString()} places
        </div>

        <form
          className="flex flex-1 min-w-70 items-center gap-2"
          onSubmit={handleSemanticSearchSubmit}
        >
          <input
            className="flex-1 text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
            type="text"
            placeholder="e.g. chill on beach, local food, sunset views"
            value={semanticQuery}
            onChange={(e) => setSemanticQuery(e.target.value)}
            disabled={semanticLoading}
          />
          <button
            type="button"
            className="text-sm md:text-base bg-white/10 hover:bg-white/20 border border-white/15 rounded px-3 py-2 disabled:opacity-60"
            onClick={() => void runSemanticSearch()}
            disabled={
              semanticLoading ||
              normalizedSemanticQuery.length < 3 ||
              !hasValidResultLimit ||
              isAlreadyExecutedSearch
            }
          >
            {semanticLoading ? "Searching..." : "Find closest"}
          </button>
        </form>
      </div>

      {semanticError ? (
        <div className="mt-2 text-sm text-red-300">{semanticError}</div>
      ) : null}
    </div>
  );
}

export default memo(MapControls);
