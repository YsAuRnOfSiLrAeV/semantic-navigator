import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { mapEngine } from "../engine/mapEngine";
import {
  runSemanticSearch,
  setCustomLimit,
  setLimitChoice,
  setSelectedId,
  setSemanticQuery,
} from "../actions/mapActions";
import { parseMapUrlState, resolveResultLimit } from "./mapUrlParams";
import { useMapValue } from "../selectors/mapSelectors";

export function useMapUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInternalUrlUpdateRef = useRef(false);

  const selectedPointId = useMapValue("selectedId");
  const lastExecutedSemanticQuery = useMapValue("lastExecutedSemanticQuery");
  const lastExecutedResultLimit = useMapValue("lastExecutedResultLimit");

  // URL -> state
  useEffect(() => {
    if (isInternalUrlUpdateRef.current) {
      isInternalUrlUpdateRef.current = false;
      return;
    }

    const parsedMapUrlState = parseMapUrlState(searchParams);

    const currentSemanticQuery = mapEngine.getCurrentValue("semanticQuery");
    const currentLimitChoice = mapEngine.getCurrentValue("limitChoice");
    const currentCustomLimit = mapEngine.getCurrentValue("customLimit");
    const currentSelectedPointId = mapEngine.getCurrentValue("selectedId");

    const currentLastExecutedSemanticQuery =
      mapEngine.getCurrentValue("lastExecutedSemanticQuery");
    const currentLastExecutedResultLimit =
      mapEngine.getCurrentValue("lastExecutedResultLimit");

    if (parsedMapUrlState.semanticQuery !== currentSemanticQuery) {
      setSemanticQuery(parsedMapUrlState.semanticQuery);
    }

    if (parsedMapUrlState.limitChoice !== currentLimitChoice) {
      setLimitChoice(parsedMapUrlState.limitChoice);
    }

    if (parsedMapUrlState.limitChoice === "custom") {
      if (parsedMapUrlState.customLimit !== currentCustomLimit) {
        setCustomLimit(parsedMapUrlState.customLimit);
      }
    } else if (currentCustomLimit !== "") {
      setCustomLimit("");
    }

    if (parsedMapUrlState.selectedPointId !== currentSelectedPointId) {
      setSelectedId(parsedMapUrlState.selectedPointId);
    }

    const parsedResultLimit = resolveResultLimit(
      parsedMapUrlState.limitChoice,
      parsedMapUrlState.customLimit
    );
    const normalizedSemanticQueryFromUrl = parsedMapUrlState.semanticQuery.trim();

    const shouldRunSemanticSearchFromUrl =
      normalizedSemanticQueryFromUrl.length >= 3 &&
      parsedResultLimit !== null &&
      (
        normalizedSemanticQueryFromUrl !== currentLastExecutedSemanticQuery ||
        parsedResultLimit !== currentLastExecutedResultLimit
      );

    if (shouldRunSemanticSearchFromUrl) {
      void runSemanticSearch();
    }
  }, [searchParams]);

  // state -> URL
  useEffect(() => {
    const nextSearchParams = new URLSearchParams();

    const normalizedExecutedSemanticQuery = lastExecutedSemanticQuery.trim();
    if (normalizedExecutedSemanticQuery.length > 0) {
      nextSearchParams.set("semanticQuery", normalizedExecutedSemanticQuery);
    }

    if (
      lastExecutedResultLimit !== null &&
      Number.isInteger(lastExecutedResultLimit) &&
      lastExecutedResultLimit >= 1
    ) {
      nextSearchParams.set("resultLimit", String(lastExecutedResultLimit));
    }

    if (selectedPointId) {
      nextSearchParams.set("selectedPointId", selectedPointId);
    }

    if (searchParams.toString() !== nextSearchParams.toString()) {
      isInternalUrlUpdateRef.current = true;
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [
    lastExecutedSemanticQuery,
    lastExecutedResultLimit,
    selectedPointId,
    searchParams,
    setSearchParams,
  ]);
}