import { useEffect } from "react";
import { fetchPoints } from "../api/api";
import { MapControls, MapPlot, PointDetailsPanel } from "../components";
import { setError, setLoading, setPoints } from "../store/mapSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

const DEBOUNCE_MS = Number(import.meta.env.VITE_LIMIT_INPUT_DEBOUNCE_MS);

export default function MapPage() {
  const dispatch = useAppDispatch();
  const { loading, error, limitChoice, customLimit } =
    useAppSelector((state) => state.map);

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | null = null;

    const run = async (limit: number | undefined) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const data = await fetchPoints(limit, controller.signal);
        dispatch(setPoints(data));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        dispatch(setError(error instanceof Error ? error.message : "Unknown error"));
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (limitChoice === "custom") {
      timeoutId = window.setTimeout(() => {
        const parsed = Number(customLimit);

        if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
          dispatch(setError("Custom limit must be a positive integer."));
          return;
        }

        void run(parsed);
      }, DEBOUNCE_MS);
    } else {
      void run(Number(limitChoice));
    }

    return () => {
      controller.abort();

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [limitChoice, customLimit, dispatch]);

  return (
    <>
      <MapControls/>

      <div className="w-full flex-1 min-h-0">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          <main className="min-w-0 border-white/10 lg:border-r flex flex-col min-h-0">
            <div className="p-4 flex-1 min-h-0">
              <div className="h-full rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-base text-zinc-300">
                    Loading points...
                  </div>
                ) : error ? (
                  <div className="p-4 text-base text-red-300">{error}</div>
                ) : (
                  <MapPlot/>
                )}
              </div>
            </div>
          </main>

          <PointDetailsPanel/>
        </div>
      </div>
    </>
  );
}
