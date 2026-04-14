import { test, expect } from "@playwright/test";
import { makePoints, mockPointsApi, mockSemanticSearchApi } from "./helpers/mockApi";

test.beforeEach(async ({ page }) => {
  const points = makePoints(3);
  await mockPointsApi(page, points);
  await mockSemanticSearchApi(page, points);
});

test("updates URL only after search submit", async ({ page }) => {
  const getQueryParam = (name: string) => new URL(page.url()).searchParams.get(name);

  await page.goto("/map");

  const queryInput = page.getByPlaceholder("e.g. chill on beach, local food, sunset views");
  await expect(queryInput).toBeVisible();

  // while typing or filling URL should not be updated yet
  await queryInput.fill("beach vibes and local food");
  await expect
    .poll(() => getQueryParam("semanticQuery"))
    .toBeNull();

  // submit with Enter
  await queryInput.press("Enter");
  await expect
    .poll(() => getQueryParam("semanticQuery"))
    .toBe("beach vibes and local food");

  // change draft query, URL must still keep last executed query
  await queryInput.fill("street racing event");
  await expect
    .poll(() => getQueryParam("semanticQuery"))
    .toBe("beach vibes and local food");

  // submit with button
  await page.getByRole("button", { name: "Find closest" }).click();
  await expect
    .poll(() => getQueryParam("semanticQuery"))
    .toBe("street racing event");
});