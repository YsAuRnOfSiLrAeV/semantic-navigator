import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { mapEngine } from "./mapEngine";
import {
  runSemanticSearch,
  setCustomLimit,
  setLimitChoice,
  setSelectedId,
  setSemanticQuery,
} from "./mapActions";
import { useMapValue } from "./mapHooks";
import { buildMapUrlState, parseMapUrlState } from "./mapUrlParams";

export function useMapUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();

  const semanticQuery = useMapValue("semanticQuery");
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
  const selectedPointId = useMapValue("selectedId");

  // URL -> state
  useEffect(() => {
    const parsedMapUrlState = parseMapUrlState(searchParams);

    const currentSemanticQuery = mapEngine.getCurrentValue("semanticQuery");
    const currentLimitChoice = mapEngine.getCurrentValue("limitChoice");
    const currentCustomLimit = mapEngine.getCurrentValue("customLimit");
    const currentSelectedPointId = mapEngine.getCurrentValue("selectedId");

    let semanticQueryChanged = false;
    let resultLimitChanged = false;

    if (parsedMapUrlState.semanticQuery !== currentSemanticQuery) {
      setSemanticQuery(parsedMapUrlState.semanticQuery);
      semanticQueryChanged = true;
    }

    if (parsedMapUrlState.limitChoice !== currentLimitChoice) {
      setLimitChoice(parsedMapUrlState.limitChoice);
      resultLimitChanged = true;
    }

    if (parsedMapUrlState.limitChoice === "custom") {
      if (parsedMapUrlState.customLimit !== currentCustomLimit) {
        setCustomLimit(parsedMapUrlState.customLimit);
        resultLimitChanged = true;
      }
    } else if (currentCustomLimit !== "") {
      setCustomLimit("");
    }

    if (parsedMapUrlState.selectedPointId !== currentSelectedPointId) {
      setSelectedId(parsedMapUrlState.selectedPointId);
    }

    if (
      parsedMapUrlState.semanticQuery.length >= 3 &&
      semanticQueryChanged &&
      !resultLimitChanged
    ) {
      void runSemanticSearch();
    }
  }, [searchParams]);

  // state -> URL
  useEffect(() => {
    const nextSearchParams = buildMapUrlState({
      semanticQuery,
      limitChoice,
      customLimit,
      selectedPointId,
    });

    const previousSearchParamsString = searchParams.toString();
    const nextSearchParamsString = nextSearchParams.toString();

    if (previousSearchParamsString !== nextSearchParamsString) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [semanticQuery, limitChoice, customLimit, selectedPointId, searchParams, setSearchParams]);
}
