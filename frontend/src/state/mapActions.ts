import { navigatorApi } from "../api/apiClient";
import type { LimitChoice, TravelPoint } from "../types";
import { initialMapState, mapEngine } from "./mapEngine";

function resolveCurrentTopK(): number {
  const limitChoice = mapEngine.getCurrentValue("limitChoice");

  if (limitChoice === "custom") {
    const customLimit = mapEngine.getCurrentValue("customLimit");
    const parsed = Number(customLimit);
    if (Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= 1) {
      return parsed;
    }
    return Number(import.meta.env.VITE_SEMANTIC_TOP_K ?? "30");
  }

  return Number(limitChoice);
}

export function setPoints(points: TravelPoint[]) {
  const prevSelectedId = mapEngine.getCurrentValue("selectedId");
  const nextSelectedId =
    prevSelectedId && points.some((p) => p.id === prevSelectedId)
      ? prevSelectedId
      : (points[0]?.id ?? null);

  mapEngine.updateTotalValue((prev) => ({
    ...prev,
    points,
    selectedId: nextSelectedId,
  }));
}

export function setSelectedId(id: string | null) {
  mapEngine.setValue("selectedId", id);
}

export function setOpen(open: boolean) {
  mapEngine.setValue("open", open);
}

export function setLimitChoice(limitChoice: LimitChoice) {
  mapEngine.setValue("limitChoice", limitChoice);
}

export function setCustomLimit(customLimit: string) {
  mapEngine.setValue("customLimit", customLimit);
}

export function setLoading(loading: boolean) {
  mapEngine.setValue("loading", loading);
}

export function setError(error: string | null) {
  mapEngine.setValue("error", error);
}

export function setSemanticQuery(semanticQuery: string) {
  mapEngine.setValue("semanticQuery", semanticQuery);
}

export function setSemanticLoading(semanticLoading: boolean) {
  mapEngine.setValue("semanticLoading", semanticLoading);
}

export function setSemanticError(semanticError: string | null) {
  mapEngine.setValue("semanticError", semanticError);
}

function isSameAsLastExecutedSearch(normalizedSemanticQuery: string, resultLimit: number): boolean {
  const lastExecutedSemanticQuery = mapEngine.getCurrentValue("lastExecutedSemanticQuery");
  const lastExecutedResultLimit = mapEngine.getCurrentValue("lastExecutedResultLimit");

  return (
    normalizedSemanticQuery === lastExecutedSemanticQuery &&
    resultLimit === lastExecutedResultLimit
  );
}

export async function runSemanticSearch() {
  const query = mapEngine.getCurrentValue("semanticQuery").trim();

  if (query.length < 3) {
    setSemanticError("Please enter at least 3 characters.");
    return;
  }

  const resultLimit = resolveCurrentTopK();
  if (isSameAsLastExecutedSearch(query, resultLimit)) {
    return;
  }

  try {
    setSemanticLoading(true);
    setSemanticError(null);

    const response = await navigatorApi.searchSemantic(query, {
      topK: resultLimit,
    });

    const points = response.results.map((item) => item.point);
    setPoints(points);
    setOpen(false);

    mapEngine.updateTotalValue((prev) => ({
      ...prev,
      lastExecutedSemanticQuery: query,
      lastExecutedResultLimit: resultLimit,
    }));
  } catch (error) {
    setSemanticError(error instanceof Error ? error.message : "Semantic search failed");
  } finally {
    setSemanticLoading(false);
  }
}

export function resetMapState() {
  mapEngine.updateTotalValue(() => ({ ...initialMapState }));
}

export async function loadPoints(limit: number | undefined, signal: AbortSignal) {
  try {
    setLoading(true);
    setError(null);
    const data = await navigatorApi.fetchPoints(limit, signal);
    setPoints(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
}
