import { memo } from "react";
import type { LimitChoice } from "../../types";
import { LimitChoices } from "../../constants";
import { setCustomLimit, setLimitChoice } from "../../state/actions/mapActions";
import { useMapValue } from "../../state/selectors/mapSelectors";

export const ResultLimitSelector = memo(function ResultLimitSelector() {
  const limitChoice = useMapValue("limitChoice");
  const customLimit = useMapValue("customLimit");
  const pointsCount = useMapValue("points").length;
  const totalPlacesCount = useMapValue("totalPlacesCount");

  return (
    <>
      <label className="text-sm md:text-base text-zinc-300 flex items-center gap-3">
        <span className="font-medium">Results</span>
        <select
          className="text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
          value={limitChoice}
          onChange={(e) => setLimitChoice(e.target.value as LimitChoice)}
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
          <span className="font-medium">Top K</span>
          <input
            className="w-32 text-sm md:text-base bg-zinc-950 border border-white/15 rounded px-3 py-2"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="e.g. 222"
            value={customLimit}
            onChange={(e) => setCustomLimit(e.target.value)}
          />
        </label>
      ) : null}

      <div className="text-sm md:text-base text-zinc-400">
        Showing {pointsCount.toLocaleString()} of {(totalPlacesCount ?? pointsCount).toLocaleString()} places
      </div>
    </>
  );
})
