import { createEngine } from "@ysaurnofsilraev/state-manager";
import type { LimitChoice, TravelPoint } from "../../types";

export type MapState = {
  points: TravelPoint[];
  selectedId: string | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  limitChoice: LimitChoice;
  customLimit: string;

  semanticQuery: string;
  semanticLoading: boolean;
  semanticError: string | null;

  lastExecutedSemanticQuery: string;
  lastExecutedResultLimit: number | null;

  totalPlacesCount: number | null;
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

  semanticQuery: "",
  semanticLoading: false,
  semanticError: null,

  lastExecutedSemanticQuery: "",
  lastExecutedResultLimit: null,
  totalPlacesCount: null,
};

export const mapEngine = createEngine<MapState>(initialMapState);
