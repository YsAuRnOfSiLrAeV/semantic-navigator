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

// Resolves the current result-limit value from custom inputs.
// Returns null when the value is not a positive integer.
export function resolveResultLimit(
  limitChoice: LimitChoice,
  customLimit: string
): number | null {
  const parsedLimit =
    limitChoice === "custom" ? Number(customLimit) : Number(limitChoice);

  if (
    Number.isFinite(parsedLimit) &&
    Number.isInteger(parsedLimit) &&
    parsedLimit >= 1
  ) {
    return parsedLimit;
  }

  return null;
}

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

  const resolvedCustomLimit = resolveResultLimit("custom", normalizedResultLimit);
  if (resolvedCustomLimit !== null) {
    return {
      limitChoice: "custom",
      customLimit: String(resolvedCustomLimit),
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
