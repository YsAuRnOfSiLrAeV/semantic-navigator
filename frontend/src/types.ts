export type LimitChoice = "5" | "10" | "30" | "50" | "100" | "custom";

export interface TravelPoint {
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
}

export interface TravelQuery {
  text: string;
  topK: number;
}

export interface SavedPlace {
  pointId: string;
  note: string;
  createdAt: string;
}

export interface SemanticSearchResult {
  point: TravelPoint;
  score: number;
}

export interface SemanticSearchResponse {
  query: string;
  top_k: number;
  total_candidates: number;
  results: SemanticSearchResult[];
}
