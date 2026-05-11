import { useEngineMultipleValues, useEngineValue } from "@ysaurnofsilraev/state-manager/react";
import { mapEngine, type MapState } from "../engine/mapEngine";
import { resolveResultLimit } from "../url/mapUrlParams";

const SELECTED_KEYS = ["points", "selectedId"] as const;

const RESULT_LIMIT_KEYS = ["limitChoice", "customLimit"] as const;

const SEARCH_DEDUP_KEYS = [
  "semanticQuery",
  "lastExecutedSemanticQuery",
  "lastExecutedResultLimit",
  "selectedDatasetId",
  "lastExecutedDatasetId",
  "limitChoice",
  "customLimit",
] as const;

export function useMapValue<K extends keyof MapState>(key: K): MapState[K] {
  return useEngineValue(mapEngine, key);
}

export function useSelectedPoint() {
  return useEngineMultipleValues(mapEngine, SELECTED_KEYS, (state) => {
    const { points, selectedId } = state;
    if (!selectedId) return null;
    return points.find((point) => point.id === selectedId) ?? null;
  });
}

export function useHasValidResultLimit(): boolean {
  return useEngineMultipleValues(mapEngine, RESULT_LIMIT_KEYS, (state) => {
    return resolveResultLimit(state.limitChoice, state.customLimit) !== null;
  });
}

export function useIsSearchAlreadyExecuted(): boolean {
  return useEngineMultipleValues(mapEngine, SEARCH_DEDUP_KEYS, (state) => {
    const normalizedQuery = state.semanticQuery.trim();
    if (normalizedQuery.length < 3 || state.lastExecutedResultLimit === null) {
      return false;
    }

    const currentLimit = resolveResultLimit(state.limitChoice, state.customLimit);
    if (currentLimit === null) {
      return false;
    }

    return (
      normalizedQuery === state.lastExecutedSemanticQuery &&
      currentLimit === state.lastExecutedResultLimit &&
      state.selectedDatasetId === state.lastExecutedDatasetId
    );
  });
}
