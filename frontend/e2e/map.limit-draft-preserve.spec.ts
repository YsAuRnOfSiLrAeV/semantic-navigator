// frontend/e2e/map.limit-draft-preserve.spec.ts
import { expect, test } from "@playwright/test";
import { makePoints, mockPointsApi } from "./helpers/mockApi";

test("changing result limit preserves draft query and updates map using last executed query", async ({ page }) => {
  const allPoints = makePoints(50);

  // points initial load
  await mockPointsApi(page, allPoints);

  // semantic-search mock: returns top_k points from allPoints and tracks last request body
  let lastSemanticBody: { query?: string; top_k?: number } | null = null;

  await page.route("**/semantic-search", async (route) => {
    const request = route.request();
    const body = (request.postDataJSON?.() ?? {}) as { query?: string; top_k?: number };

    const topK = Number(body.top_k ?? 30);
    const k = Number.isFinite(topK) && topK > 0 ? Math.floor(topK) : 30;

    lastSemanticBody = body;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: body.query ?? "",
        top_k: k,
        total_candidates: allPoints.length,
        results: allPoints.slice(0, k).map((point) => ({
          point,
          score: 0.9,
        })),
      }),
    });
  });

  await page.goto("/map");

  const queryInput = page.getByPlaceholder("e.g. chill on beach, local food, sunset views");
  await expect(queryInput).toBeVisible();

  // 1) execute first search
  await queryInput.fill("beach vibes");
  await queryInput.press("Enter");

  await expect
    .poll(() => new URL(page.url()).searchParams.get("semanticQuery"))
    .toBe("beach vibes");

  await expect(page.getByText(/Showing 30 of 50 places/i)).toBeVisible();

  // 2) type draft, do not submit
  await queryInput.fill("beach vibes with sunset");
  await expect(queryInput).toHaveValue("beach vibes with sunset");

  // URL still points to last executed query
  await expect
    .poll(() => new URL(page.url()).searchParams.get("semanticQuery"))
    .toBe("beach vibes");

  // 3) change Results to 10
  await page.getByRole("combobox").selectOption("10");

  // map should update to 10 based on LAST EXECUTED query, not draft
  await expect(page.getByText(/Showing 10 of 50 places/i)).toBeVisible();

  // draft must stay in input
  await expect(queryInput).toHaveValue("beach vibes with sunset");

  // request must be made with old executed query + new top_k
  await expect
    .poll(() => lastSemanticBody?.query ?? null)
    .toBe("beach vibes");

  await expect
    .poll(() => lastSemanticBody?.top_k ?? null)
    .toBe(10);
});
