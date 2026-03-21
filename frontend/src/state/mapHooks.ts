import { useEngineMultipleValues, useEngineValue } from "@ysaurnofsilraev/state-manager/react";
import { mapEngine, type MapState } from "./mapEngine";
import { useEffect } from "react";
import { loadPoints, setError } from "./mapActions";

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
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | null = null;

    if (limitChoice === "custom") {
      timeoutId = window.setTimeout(() => {
        const parsed = Number(customLimit);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
          setError("Custom limit must be a positive integer.");
          return;
        }
        void loadPoints(parsed, controller.signal);
      }, DEBOUNCE_MS);
    } else {
      void loadPoints(Number(limitChoice), controller.signal);
    }

    return () => {
      controller.abort();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [limitChoice, customLimit]);
}