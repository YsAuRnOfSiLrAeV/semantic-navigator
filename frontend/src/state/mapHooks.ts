import { useEngineMultipleValues, useEngineValue } from "@ysaurnofsilraev/state-manager/react";
import { mapEngine, type MapState } from "./mapEngine";
import { useEffect } from "react";
import { loadPoints, runSemanticSearch } from "./mapActions";

const SELECTED_KEYS = ["points", "selectedId"] as const;
const DEBOUNCE_MS = Number(import.meta.env.VITE_LIMIT_INPUT_DEBOUNCE_MS);

export function useMapValue<K extends keyof MapState>(key: K): MapState[K] {
  return useEngineValue(mapEngine, key);
}

export function useSelectedPoint() {
  return useEngineMultipleValues(mapEngine, SELECTED_KEYS, (state) => {
    const { points, selectedId } = state;
    if (!selectedId) return null;
    return points.find((p) => p.id === selectedId) ?? null;
  });
}

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

  useEffect(() => {
    const q = mapEngine.getCurrentValue("semanticQuery").trim();
    if (q.length < 3) return;

    if (limitChoice === "custom") {
      const parsed = Number(customLimit);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) return;

      const id = window.setTimeout(() => {
        void runSemanticSearch();
      }, DEBOUNCE_MS);

      return () => window.clearTimeout(id);
    }

    void runSemanticSearch();
  }, [limitChoice, customLimit]);
}