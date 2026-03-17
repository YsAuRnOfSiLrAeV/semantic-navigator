import type { LimitChoice, TravelPoint } from "../types";
import { initialMapState, mapEngine } from "./mapEngine";

export function setPoints(points: TravelPoint[]) {
  const prevSelectedId = mapEngine.getCurrentValue("selectedId");
  const nextSelectedId =
    prevSelectedId && points.some((p) => p.id === prevSelectedId)
      ? prevSelectedId
      : (points[0]?.id ?? null);

  mapEngine.updateTotalValue((prev) => ({
    ...prev,
    points,
    selectedId: nextSelectedId,
  }));
}

export function setSelectedId(id: string | null) {
  mapEngine.setValue("selectedId", id);
}

export function setOpen(open: boolean) {
  mapEngine.setValue("open", open);
}

export function setLimitChoice(limitChoice: LimitChoice) {
  mapEngine.setValue("limitChoice", limitChoice);
}

export function setCustomLimit(customLimit: string) {
  mapEngine.setValue("customLimit", customLimit);
}

export function setLoading(loading: boolean) {
  mapEngine.setValue("loading", loading);
}

export function setError(error: string | null) {
  mapEngine.setValue("error", error);
}

export function resetMapState() {
  mapEngine.updateTotalValue(() => ({ ...initialMapState }));
}
