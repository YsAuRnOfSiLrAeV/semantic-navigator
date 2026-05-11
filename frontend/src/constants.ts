import type { DatasetId } from "./types";

// connected to LimitChoice - the same values
export const LimitChoices = {
  "5": "5",
  "10": "10",
  "30": "30",
  "50": "50",
  "100": "100",
  custom: "Custom...",
} as const;

export const DatasetLabels: Record<DatasetId, string> = {
  attractions_global: "Attractions",
  sport_global: "Sport",
  museums_global: "Museums",
};

const allDatasetIds = Object.keys(DatasetLabels) as DatasetId[];

function isDatasetId(value: string): value is DatasetId {
  return (allDatasetIds as string[]).includes(value);
}

const defaultDatasetIdFromEnvironment = (import.meta.env.VITE_DEFAULT_DATASET_ID ?? "").trim();

export const DefaultDatasetId: DatasetId = isDatasetId(defaultDatasetIdFromEnvironment)
  ? defaultDatasetIdFromEnvironment
  : "attractions_global";

const enabledDatasetIdsFromEnvironment = (import.meta.env.VITE_ENABLED_DATASET_IDS ?? "")
  .split(",")
  .map((value: string) => value.trim())
  .filter((value): value is DatasetId => isDatasetId(value));

export const EnabledDatasetIds: DatasetId[] =
  enabledDatasetIdsFromEnvironment.length > 0
    ? enabledDatasetIdsFromEnvironment
    : [DefaultDatasetId];
