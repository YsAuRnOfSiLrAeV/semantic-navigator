import { navigatorApi } from "../../api/apiClient";
import type { DatasetId, LimitChoice, TravelPoint } from "../../types";
import { initialMapState, mapEngine } from "../engine/mapEngine";
import { resolveResultLimit } from "../url/mapUrlParams";

function resolveCurrentTopK(): number {
  const resolved = resolveResultLimit(
    mapEngine.getCurrentValue("limitChoice"),
    mapEngine.getCurrentValue("customLimit")
  );

  return resolved ?? Number(import.meta.env.VITE_SEMANTIC_TOP_K ?? "30");
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

function isSameAsLastExecutedSearch(
  normalizedSemanticQuery: string,
  resultLimit: number,
  selectedDatasetId: DatasetId
): boolean {
  const lastExecutedSemanticQuery = mapEngine.getCurrentValue("lastExecutedSemanticQuery");
  const lastExecutedResultLimit = mapEngine.getCurrentValue("lastExecutedResultLimit");
  const lastExecutedDatasetId = mapEngine.getCurrentValue("lastExecutedDatasetId");

  return (
    normalizedSemanticQuery === lastExecutedSemanticQuery &&
    resultLimit === lastExecutedResultLimit &&
    selectedDatasetId === lastExecutedDatasetId
  );
}

async function executeSemanticSearch(query: string) {
  if (query.length < 3) {
    setSemanticError("Please enter at least 3 characters.");
    return;
  }

  const resultLimit = resolveCurrentTopK();
  const selectedDatasetId = mapEngine.getCurrentValue("selectedDatasetId");
  if (isSameAsLastExecutedSearch(query, resultLimit, selectedDatasetId)) return;


  try {
    setSemanticLoading(true);
    setSemanticError(null);

    const response = await navigatorApi.searchSemantic(query, {
      datasetId: selectedDatasetId,
      topK: resultLimit,
    });

    setTotalPlacesCount(response.total_candidates);
    setPoints(response.results.map((item) => item.point));
    setOpen(false);

    mapEngine.updateTotalValue((prev) => ({
      ...prev,
      lastExecutedSemanticQuery: query,
      lastExecutedResultLimit: resultLimit,
      lastExecutedDatasetId: selectedDatasetId,
    }));
  } catch (error) {
    setSemanticError(error instanceof Error ? error.message : "Semantic search failed");
  } finally {
    setSemanticLoading(false);
  }
}

export async function runSemanticSearch() {
  const query = mapEngine.getCurrentValue("semanticQuery").trim();
  await executeSemanticSearch(query);
}

export async function rerunLastExecutedSemanticSearch() {
  const query = mapEngine.getCurrentValue("lastExecutedSemanticQuery").trim();
  if (query.length < 3) return;
  await executeSemanticSearch(query);
}

export function resetMapState() {
  mapEngine.updateTotalValue(() => ({ ...initialMapState }));
}

export async function loadPoints(limit: number | undefined, signal: AbortSignal) {
  try {
    setLoading(true);
    setError(null);
    const selectedDatasetId = mapEngine.getCurrentValue("selectedDatasetId");
    const data = await navigatorApi.fetchPoints(selectedDatasetId, limit, signal);
    setTotalPlacesCount(data.length);
    setPoints(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
}

export function setTotalPlacesCount(totalPlacesCount: number | null) {
  mapEngine.setValue("totalPlacesCount", totalPlacesCount);
}

export function setSelectedDatasetId(selectedDatasetId: DatasetId) {
  mapEngine.updateTotalValue((prev) => ({
    ...prev,
    selectedDatasetId,
    selectedId: null,
    open: false,
    error: null,
    semanticError: null,
  }));
}
