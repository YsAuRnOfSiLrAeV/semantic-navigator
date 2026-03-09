import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
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

const initialState: MapState = {
  points: [],
  selectedId: null,
  open: false,
  loading: false,
  error: null,
  limitChoice: DEFAULT_LIMIT,
  customLimit: "",
};

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setPoints(state, action: PayloadAction<TravelPoint[]>) {
      state.points = action.payload;
      if (state.selectedId && !action.payload.some((p) => p.id === state.selectedId)) {
        state.selectedId = action.payload[0]?.id ?? null;
      }
    },
    setSelectedId(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    setOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
    setLimitChoice(state, action: PayloadAction<LimitChoice>) {
      state.limitChoice = action.payload;
    },
    setCustomLimit(state, action: PayloadAction<string>) {
      state.customLimit = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetMapState() {
      return initialState;
    },
  },
});

export const {
  setPoints,
  setSelectedId,
  setOpen,
  setLimitChoice,
  setCustomLimit,
  setLoading,
  setError,
  resetMapState,
} = mapSlice.actions;

export default mapSlice.reducer;
