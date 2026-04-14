import { FormEvent, memo, useCallback } from "react";
import { useMapValue } from "../state/mapHooks";
import { runSemanticSearch, setSemanticQuery } from "../state/mapActions";

function SemanticSearchBar() {
  const semanticQuery = useMapValue("semanticQuery");
  const semanticLoading = useMapValue("semanticLoading");
  const semanticError = useMapValue("semanticError");

  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
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
    <>
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
          type="submit"
          className="text-sm md:text-base bg-white/10 hover:bg-white/20 border border-white/15 rounded px-3 py-2 disabled:opacity-60"
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

      {semanticError ? (
        <div className="mt-2 text-sm text-red-300">{semanticError}</div>
      ) : null}
    </>
  );
}

export default memo(SemanticSearchBar);
