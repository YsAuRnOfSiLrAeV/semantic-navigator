import { createEngine } from "@ysaurnofsilraev/state-manager";
import type { LimitChoice, TravelPoint } from "../types";

export type MapState = {
  points: TravelPoint[];
  selectedId: string | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  limitChoice: LimitChoice;
  customLimit: string;
};

const DEFAULT_LIMIT = import.meta.env.VITE_DEFAULT_POINTS_LIMIT as LimitChoice;

export const initialMapState: MapState = {
  points: [],
  selectedId: null,
  open: false,
  loading: false,
  error: null,
  limitChoice: DEFAULT_LIMIT,
  customLimit: "",
};

export const mapEngine = createEngine<MapState>(initialMapState);
