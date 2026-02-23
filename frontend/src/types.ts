export type LimitChoice = "500" | "1000" | "3000" | "5000" | "custom";

export interface TravelPoint {
  id: string;
  x: number;
  y: number;
  cluster: number;
  headline: string;
  short_description: string;
  link: string;
  category: string;
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
