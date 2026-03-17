import { useEngineMultipleValues, useEngineValue } from "@ysaurnofsilraev/state-manager/react";
import { mapEngine, type MapState } from "./mapEngine";

const SELECTED_KEYS = ["points", "selectedId"] as const;

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
