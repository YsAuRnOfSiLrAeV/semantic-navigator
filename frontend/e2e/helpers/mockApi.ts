import type { Page } from "@playwright/test";

type TestPoint = {
  id: string;
  x: number;
  y: number;
  cluster: number;
  name: string;
  description: string;
  categories: string[];
  review_tags: string[];
  destination: string;
  rating: number;
  attraction_url: string;
  tripadvisor_url: string;
  picture: string;
};

export function makePoints(count: number): TestPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p-${index + 1}`,
    x: index + 0.1,
    y: index + 0.2,
    cluster: index % 3,
    name: `Place ${index + 1}`,
    description: `Description ${index + 1}`,
    categories: ["Category"],
    review_tags: ["tag"],
    destination: "Test City",
    rating: 4.5,
    attraction_url: "",
    tripadvisor_url: `https://example.com/${index + 1}`,
    picture: "",
  }));
}

export async function mockPointsApi(page: Page, points: TestPoint[]) {
  await page.route("**/points**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(points),
    });
  });
}

export async function mockSemanticSearchApi(page: Page, points: TestPoint[]) {
  await page.route("**/semantic-search", async (route) => {
    const body = (route.request().postDataJSON() ?? {}) as { query?: string; top_k?: number };
    const topK = Number(body.top_k ?? 30);
    const sliced = points.slice(0, Math.max(0, Math.min(topK, points.length)));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: body.query ?? "",
        top_k: topK,
        total_candidates: points.length,
        results: sliced.map((point, idx) => ({ point, score: 1 - idx * 0.01 })),
      }),
    });
  });
}
