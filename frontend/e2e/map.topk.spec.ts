import { test, expect } from "@playwright/test";
import { makePoints, mockPointsApi, mockSemanticSearchApi } from "./helpers/mockApi";

test("keeps query and updates shown places when top_k changes", async ({ page }) => {
  // Create deterministic mocked dataset for points and semantic search responses.
  const points = makePoints(10);

  // Mock initial points loading and semantic search endpoint for this page.
  await mockPointsApi(page, points);
  await mockSemanticSearchApi(page, points);

  // Helper to read current query params from browser URL.
  const getQueryParam = (name: string) => new URL(page.url()).searchParams.get(name);

  // Open map page.
  await page.goto("/map");

  // Submit first semantic query.
  const queryInput = page.getByPlaceholder("e.g. chill on beach, local food, sunset views");
  await queryInput.fill("beach vibes and local food");
  await queryInput.press("Enter");

  // After first submit, map shows all 10 places and URL stores submitted query.
  await expect(page.getByText("Showing 10 of 10 places")).toBeVisible();
  await expect.poll(() => getQueryParam("semanticQuery")).toBe("beach vibes and local food");

  // Change top_k to 5: same query should stay, rendered places should shrink.
  await page.getByRole("combobox").selectOption("5");
  await expect(page.getByText("Showing 5 of 10 places")).toBeVisible();
  await expect.poll(() => getQueryParam("semanticQuery")).toBe("beach vibes and local food");

  // Change top_k back to 10: same query should stay, rendered places should grow back.
  await page.getByRole("combobox").selectOption("10");
  await expect(page.getByText("Showing 10 of 10 places")).toBeVisible();
  await expect.poll(() => getQueryParam("semanticQuery")).toBe("beach vibes and local food");
});
