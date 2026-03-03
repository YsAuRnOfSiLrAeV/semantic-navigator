import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSemanticNavigator } from "./useSemanticNavigator";

describe("useSemanticNavigator", () => {
  it("should initialize with the default state", () => {
    const { result } = renderHook(() => useSemanticNavigator());

    expect(result.current.state.points).toEqual([]);
    expect(result.current.state.selectedId).toBeNull();
    expect(result.current.state.customLimit).toBe("");
    expect(result.current.state.open).toBe(false);
    expect(result.current.state.error).toBeNull();

  });
});
