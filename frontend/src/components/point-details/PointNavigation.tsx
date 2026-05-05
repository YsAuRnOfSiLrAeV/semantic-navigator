import { useCallback, useMemo } from "react";
import { setSelectedId } from "../../state/actions/mapActions";
import { NavigationButton } from "./NavigationButton";
import { useMapValue } from "../../state/selectors/mapSelectors";

type Props = {
  selectedId: string | null;
};

export function PointNavigation({ selectedId }: Props) {
  const points = useMapValue("points");

  const selectedIndex = useMemo(() => {
    if (!selectedId) return -1;
    return points.findIndex((point) => point.id === selectedId);
  }, [points, selectedId]);

  const canNavigate = points.length > 1 && selectedIndex >= 0;

  const handlePrevious = useCallback(() => {
    if (!canNavigate) return;
    const previousIndex = (selectedIndex - 1 + points.length) % points.length;
    setSelectedId(points[previousIndex].id);
  }, [canNavigate, points, selectedIndex]);

  const handleNext = useCallback(() => {
    if (!canNavigate) return;
    const nextIndex = (selectedIndex + 1) % points.length;
    setSelectedId(points[nextIndex].id);
  }, [canNavigate, points, selectedIndex]);

  return (
    <div className="flex items-center gap-2">
      <NavigationButton
        label="Previous"
        onClick={handlePrevious}
        disabled={!canNavigate}
      />
      <NavigationButton
        label="Next"
        onClick={handleNext}
        disabled={!canNavigate}
      />
    </div>
  );
}
