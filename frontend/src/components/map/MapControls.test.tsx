import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MapControls from "./MapControls";
import { navigatorApi } from "../../api/apiClient";
import {
  resetMapState,
  setCustomLimit,
  setLimitChoice,
  setSemanticError,
} from "../../state/actions/mapActions";

vi.mock("../api/apiClient", () => ({
  navigatorApi: {
    fetchPoints: vi.fn(),
    searchSemantic: vi.fn(),
  },
}));

describe("MapControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resetMapState();
    setLimitChoice("custom");
    setCustomLimit("30");
    setSemanticError(null);

    vi.mocked(navigatorApi.searchSemantic).mockResolvedValue({
      query: "beach vibes",
      top_k: 30,
      total_candidates: 0,
      results: [],
    });
  });

  it("renders query input and submit button", () => {
    render(<MapControls />);

    expect(
      screen.getByPlaceholderText(/chill on beach, local food, sunset views/i)
    ).toBeTruthy();

    expect(
      screen.getByRole("button", { name: /find closest/i })
    ).toBeTruthy();
  });

  it("updates query input value while typing", async () => {
    const user = userEvent.setup();
    render(<MapControls />);

    const input = screen.getByPlaceholderText(
      /chill on beach, local food, sunset views/i
    ) as HTMLInputElement;

    await user.type(input, "beach vibes");

    expect(input.value).toBe("beach vibes");
  });

  it("submits semantic search on Enter", async () => {
    const user = userEvent.setup();
    render(<MapControls />);

    const input = screen.getByPlaceholderText(
      /chill on beach, local food, sunset views/i
    );

    await user.type(input, "beach vibes");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(vi.mocked(navigatorApi.searchSemantic)).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(navigatorApi.searchSemantic)).toHaveBeenCalledWith(
      "beach vibes",
      expect.objectContaining({ topK: 30 })
    );
  });

  it("renders semantic error when API request fails", async () => {
    vi.mocked(navigatorApi.searchSemantic).mockRejectedValueOnce(
      new Error("Semantic search failed")
    );

    const user = userEvent.setup();
    render(<MapControls />);

    const input = screen.getByPlaceholderText(
      /chill on beach, local food, sunset views/i
    );

    await user.type(input, "beach vibes");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText(/semantic search failed/i)).toBeTruthy();
    });
  });

});
