import { DatasetId, SemanticSearchResponse, TravelPoint } from "../types";

export class SemanticNavigatorApi {
  constructor(private baseUrl: string) {}

  async fetchPoints(
      datasetId: DatasetId,
      limit?: number,
      signal?: AbortSignal
    ): Promise<TravelPoint[]> {
    const url = new URL(`${this.baseUrl}/points`);
    url.searchParams.set("dataset_id", datasetId);
    if (limit !== undefined) url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), {
      signal,
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    });
    if (!res.ok) throw new Error(`Failed to load points: ${res.status}`);
    return (await res.json()) as TravelPoint[];
  }

  async searchSemantic(
    query: string,
    options: {
      datasetId: DatasetId;
      topK?: number;
      limit?: number;
      signal?: AbortSignal
    }
  ): Promise<SemanticSearchResponse> {
    const { datasetId, topK = 30, limit, signal } = options;
    const url = new URL(`${this.baseUrl}/semantic-search`);
    url.searchParams.set("dataset_id", datasetId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
      signal,
      body: JSON.stringify({ query, top_k: topK, limit }),
    });
    
    if (!res.ok) throw new Error(`Failed to search points: ${res.status}`);
    return (await res.json()) as SemanticSearchResponse;
  }
}
