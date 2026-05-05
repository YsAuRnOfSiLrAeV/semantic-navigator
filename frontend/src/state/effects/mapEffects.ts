import { useEffect } from "react";
import { loadPoints, rerunLastExecutedSemanticSearch } from "../actions/mapActions";
import { useMapValue } from "../selectors/mapSelectors";

const rawDebounceMs = Number(import.meta.env.VITE_LIMIT_INPUT_DEBOUNCE_MS ?? "450");
const DEBOUNCE_MS = Number.isFinite(rawDebounceMs) && rawDebounceMs > 0 ? rawDebounceMs : 450;

export function usePointsLoader() {
  useEffect(() => {
    const controller = new AbortController();
    void loadPoints(undefined, controller.signal);

    return () => controller.abort();
  }, []);
}

export function useSemanticAutoRefresh() {
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
  const lastExecutedSemanticQuery = useMapValue("lastExecutedSemanticQuery");

  useEffect(() => {
    if (lastExecutedSemanticQuery.trim().length < 3) return;

    if (limitChoice === "custom") {
      const parsedLimit = Number(customLimit);
      if (!Number.isFinite(parsedLimit) || !Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        void rerunLastExecutedSemanticSearch();
      }, DEBOUNCE_MS);

      return () => window.clearTimeout(timeoutId);
    }

    void rerunLastExecutedSemanticSearch();
  }, [limitChoice, customLimit, lastExecutedSemanticQuery]);
}
