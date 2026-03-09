import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./index";

export const selectMap = (state: RootState) => state.map;
export const selectPoints = (state: RootState) => state.map.points;
export const selectSelectedId = (state: RootState) => state.map.selectedId;
export const selectOpen = (state: RootState) => state.map.open;
export const selectLoading = (state: RootState) => state.map.loading;
export const selectError = (state: RootState) => state.map.error;
export const selectLimitChoice = (state: RootState) => state.map.limitChoice;
export const selectCustomLimit = (state: RootState) => state.map.customLimit;

export const selectSelectedPoint = createSelector(
  [selectPoints, selectSelectedId],
  (points, selectedId) => (selectedId ? points.find((p) => p.id === selectedId) ?? null : null),
);
