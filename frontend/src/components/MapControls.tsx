import type { LimitChoice } from "../types";
import { LimitChoices } from "../constants";
import { memo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectCustomLimit, selectLimitChoice, selectPoints } from "../store/selectors";
import { setCustomLimit, setLimitChoice } from "../store/mapSlice";

function MapControls() {
  const dispatch = useAppDispatch();
  const limitChoice = useAppSelector(selectLimitChoice);
  const customLimit = useAppSelector(selectCustomLimit);
  const pointsCount = useAppSelector(selectPoints).length;

  return (
    <div className="border-b border-white/10 px-4 py-3 flex flex-wrap items-center gap-4">
      <label className="text-sm md:text-base text-zinc-300 flex items-center gap-3">
        <span className="font-medium">Points</span>
        <select
          className="text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
          value={limitChoice}
          onChange={(e) => dispatch(setLimitChoice(e.target.value as LimitChoice))}
        >
          {Object.entries(LimitChoices).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </label>

      {limitChoice === "custom" ? (
        <label className="text-sm md:text-base text-zinc-300 flex items-center gap-3">
          <span className="font-medium">N</span>
          <input
            className="w-32 text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="e.g. 222"
            value={customLimit}
            onChange={(e) => dispatch(setCustomLimit(e.target.value))}
          />
        </label>
      ) : null}

      <div className="text-sm md:text-base text-zinc-400">
        Showing {pointsCount} point{pointsCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export default memo(MapControls);
