import { test, expect } from "@playwright/test";
import { makePoints, mockPointsApi } from "./helpers/mockApi";

test.beforeEach(async ({ page }) => {
  const points = makePoints(3);
  await mockPointsApi(page, points);
});

test("map page loads controls and shows fetched places count", async ({ page }) => {
  await page.goto("/map");

  await expect(page.getByText("Results")).toBeVisible();
  await expect(page.getByRole("button", { name: "Find closest" })).toBeVisible();
  await expect(page.getByText("Showing 3 of 3 places")).toBeVisible();
});
