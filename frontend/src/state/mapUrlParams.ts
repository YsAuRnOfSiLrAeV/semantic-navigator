import { LimitChoices } from "../constants";
import type { LimitChoice } from "../types";

type ResultLimitState = {
  limitChoice: LimitChoice;
  customLimit: string;
};

export type ParsedMapUrlState = {
  semanticQuery: string;
  limitChoice: LimitChoice;
  customLimit: string;
  selectedPointId: string | null;
};

const PRESET_LIMIT_CHOICE_VALUES = Object.keys(LimitChoices).filter(
  (key) => key !== "custom"
) as Exclude<LimitChoice, "custom">[];

// Returns the default result-limit state from env (VITE_SEMANTIC_TOP_K),
// normalized into { limitChoice, customLimit }.
function getDefaultResultLimitState(): ResultLimitState {
  const semanticTopKFromEnvironment = (import.meta.env.VITE_SEMANTIC_TOP_K ?? "").trim();

  if (
    PRESET_LIMIT_CHOICE_VALUES.includes(
      semanticTopKFromEnvironment as Exclude<LimitChoice, "custom">
    )
  ) {
    return {
      limitChoice: semanticTopKFromEnvironment as Exclude<LimitChoice, "custom">,
      customLimit: "",
    };
  }

  const parsedSemanticTopK = Number(semanticTopKFromEnvironment);
  if (
    Number.isFinite(parsedSemanticTopK) &&
    Number.isInteger(parsedSemanticTopK) &&
    parsedSemanticTopK >= 1
  ) {
    return {
      limitChoice: "custom",
      customLimit: String(parsedSemanticTopK),
    };
  }

  return {
    limitChoice: "30",
    customLimit: "",
  };
}

// Parses URL resultLimit value and normalizes it into
// { limitChoice, customLimit } format used by state.
function parseResultLimitState(resultLimitFromUrl: string): ResultLimitState {
  const normalizedResultLimit = resultLimitFromUrl.trim();

  if (!normalizedResultLimit) {
    return getDefaultResultLimitState();
  }

  if (
    PRESET_LIMIT_CHOICE_VALUES.includes(
      normalizedResultLimit as Exclude<LimitChoice, "custom">
    )
  ) {
    return {
      limitChoice: normalizedResultLimit as Exclude<LimitChoice, "custom">,
      customLimit: "",
    };
  }

  const parsedCustomLimit = Number(normalizedResultLimit);
  if (Number.isFinite(parsedCustomLimit) && Number.isInteger(parsedCustomLimit) && parsedCustomLimit >= 1) {
    return {
      limitChoice: "custom",
      customLimit: String(parsedCustomLimit),
    };
  }

  return getDefaultResultLimitState();
}

// Parses full map URL state from query params and returns normalized state
// fields: semanticQuery, limitChoice, customLimit, selectedPointId.
export function parseMapUrlState(searchParams: URLSearchParams): ParsedMapUrlState {
  const semanticQuery = (searchParams.get("semanticQuery") ?? "").trim();
  const resultLimitFromUrl = searchParams.get("resultLimit") ?? "";
  const selectedPointIdFromUrl = (searchParams.get("selectedPointId") ?? "").trim();

  const parsedResultLimitState = parseResultLimitState(resultLimitFromUrl);

  return {
    semanticQuery,
    limitChoice: parsedResultLimitState.limitChoice,
    customLimit: parsedResultLimitState.customLimit,
    selectedPointId: selectedPointIdFromUrl || null,
  };
}

// Builds URL query params from current map state.
// Serializes only shareable fields (query, result limit, selected point id).
export function buildMapUrlState(params: {
  semanticQuery: string;
  limitChoice: LimitChoice;
  customLimit: string;
  selectedPointId: string | null;
}): URLSearchParams {
  const nextSearchParams = new URLSearchParams();

  const normalizedSemanticQuery = params.semanticQuery.trim();
  if (normalizedSemanticQuery) {
    nextSearchParams.set("semanticQuery", normalizedSemanticQuery);
  }

  const normalizedResultLimit =
    params.limitChoice === "custom"
      ? params.customLimit.trim()
      : params.limitChoice;

  if (normalizedResultLimit) {
    nextSearchParams.set("resultLimit", normalizedResultLimit);
  }

  if (params.selectedPointId) {
    nextSearchParams.set("selectedPointId", params.selectedPointId);
  }

  return nextSearchParams;
}
