export type LimitChoice = "500" | "1000" | "5000" | "10500" | "custom";

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
