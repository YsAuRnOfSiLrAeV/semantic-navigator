import { useCallback, useEffect, useState } from "react";
import { fetchPoints } from "../api/api";
import type { LimitChoice, SemanticNavigatorState } from "../types";

const DEFAULT_LIMIT = import.meta.env.VITE_DEFAULT_POINTS_LIMIT as LimitChoice;
const DEBOUNCE_MS = Number(import.meta.env.VITE_LIMIT_INPUT_DEBOUNCE_MS);

const initialState: SemanticNavigatorState = {
  points: [],
  selectedId: null,
  loading: false,
  error: null,
  limitChoice: DEFAULT_LIMIT,
  customLimit: "",
  open: false,
};

export function useSemanticNavigator() {
  const [state, setState] = useState<SemanticNavigatorState>(initialState);

  const setLimitChoice = useCallback((limitChoice: LimitChoice) => {
    setState((prev) => ({
      ...prev,
      limitChoice,
    }));
  }, []);

  const setCustomLimit = useCallback((customLimit: string) => {
    setState((prev) => ({
      ...prev,
      customLimit,
    }));
  }, []);

  const selectPoint = useCallback((selectedId: string) => {
    setState((prev) => ({
      ...prev,
      selectedId,
      open: true,
    }));
  }, []);

  const closeDetails = useCallback(() => {
    setState((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | null = null;

    const run = async (limit: number | undefined) => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        const points = await fetchPoints(limit, controller.signal);

        setState((prev) => ({
          ...prev,
          points,
          selectedId:
            prev.selectedId && points.some((point) => point.id === prev.selectedId)
              ? prev.selectedId
              : (points[0]?.id ?? null),
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    if (state.limitChoice === "custom") {
      timeoutId = window.setTimeout(() => {
        const parsed = Number(state.customLimit);

        if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
          setState((prev) => ({
            ...prev,
            error: "Custom limit must be a positive integer.",
          }));
          return;
        }

        void run(parsed);
      }, DEBOUNCE_MS);
    } else {
      void run(Number(state.limitChoice));
    }

    return () => {
      controller.abort();

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [state.limitChoice, state.customLimit]);

  return {
    state,
    setLimitChoice,
    setCustomLimit,
    selectPoint,
    closeDetails,
    clearError,
  };
}
