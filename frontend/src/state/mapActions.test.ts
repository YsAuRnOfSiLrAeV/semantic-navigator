import { beforeEach, describe, expect, it, vi } from "vitest";

import { navigatorApi } from "../api/apiClient";
import { mapEngine, type MapState } from "./mapEngine";
import {
  resetMapState,
  runSemanticSearch,
  setCustomLimit,
  setLimitChoice,
  setSemanticQuery,
} from "./mapActions";

vi.mock("../api/apiClient", () => ({
  navigatorApi: {
    fetchPoints: vi.fn(),
    searchSemantic: vi.fn(),
  },
}));

describe("runSemanticSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMapState();

    setLimitChoice("custom");
    setCustomLimit("30");
    setSemanticQuery("beach vibes");

    mapEngine.updateTotalValue((prev: MapState) => ({
      ...prev,
      lastExecutedSemanticQuery: "beach vibes",
      lastExecutedResultLimit: 30,
      semanticError: null,
    }));
  });

  it("skips API call when query and topK match last executed search", async () => {
    await runSemanticSearch();

    expect(vi.mocked(navigatorApi.searchSemantic)).not.toHaveBeenCalled();
    expect(mapEngine.getCurrentValue("semanticLoading")).toBe(false);
    expect(mapEngine.getCurrentValue("semanticError")).toBeNull();
  });

  it("sets validation error and skips API for short query", async () => {
  resetMapState();
  setLimitChoice("custom");
  setCustomLimit("30");
  setSemanticQuery("ab");

  await runSemanticSearch();

  expect(vi.mocked(navigatorApi.searchSemantic)).not.toHaveBeenCalled();
  expect(mapEngine.getCurrentValue("semanticError")).toBe(
    "Please enter at least 3 characters."
  );
  expect(mapEngine.getCurrentValue("semanticLoading")).toBe(false);
});

it("updates last executed search after successful API response", async () => {
  resetMapState();
  setLimitChoice("custom");
  setCustomLimit("30");
  setSemanticQuery("beach vibes");

  vi.mocked(navigatorApi.searchSemantic).mockResolvedValueOnce({
    query: "beach vibes",
    top_k: 30,
    total_candidates: 0,
    results: [],
  });

  await runSemanticSearch();

  expect(vi.mocked(navigatorApi.searchSemantic)).toHaveBeenCalledWith(
    "beach vibes",
    expect.objectContaining({ topK: 30 })
  );
  expect(mapEngine.getCurrentValue("lastExecutedSemanticQuery")).toBe("beach vibes");
  expect(mapEngine.getCurrentValue("lastExecutedResultLimit")).toBe(30);
  expect(mapEngine.getCurrentValue("semanticError")).toBeNull();
  expect(mapEngine.getCurrentValue("semanticLoading")).toBe(false);
});
});
