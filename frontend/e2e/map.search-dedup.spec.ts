import { test, expect } from "@playwright/test";
import { makePoints, mockPointsApi } from "./helpers/mockApi";

test("does not send duplicate semantic-search request for same submitted query", async ({ page }) => {
  let semanticSearchCalls = 0;

  const points = makePoints(3);
  await mockPointsApi(page, points);

  await page.route("**/semantic-search", async (route) => {
    semanticSearchCalls += 1;

    const { query = "mock" } = (route.request().postDataJSON() ?? {}) as { query?: string };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query,
        top_k: 30,
        total_candidates: points.length,
        results: points.map((point) => ({ point, score: 0.9 })),
      }),
    });
  });

  await page.goto("/map");

  const queryInput = page.getByPlaceholder("e.g. chill on beach, local food, sunset views");
  await expect(queryInput).toBeVisible();

  await queryInput.fill("beach vibes and local food");
  await queryInput.press("Enter");

  await expect.poll(() => semanticSearchCalls).toBe(1);
  await expect(page.getByRole("button", { name: "Find closest" })).toBeVisible();

  // same query again should not create a second backend call
  await queryInput.press("Enter");
  await expect.poll(() => semanticSearchCalls).toBe(1);

  // changed query should create a new backend call
  await queryInput.fill("street racing event");
  await queryInput.press("Enter");
  await expect.poll(() => semanticSearchCalls).toBe(2);
});
