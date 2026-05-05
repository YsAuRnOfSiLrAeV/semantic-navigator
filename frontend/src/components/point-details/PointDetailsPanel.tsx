import { memo, useCallback } from "react";
import { useMapValue } from "../../state/selectors/mapSelectors";
import { setOpen } from "../../state/actions/mapActions";
import { useIsDesktop } from "../../state/hooks/useIsDesktop";
import { PointDetailsContent } from "./PointDetailsContent";
import { PointDetailsPanelMobile } from "./PointDetailsPanelMobile";

export const PointDetailsPanel = memo(function PointDetailsPanel() {
  const open = useMapValue("open");
  const isDesktop = useIsDesktop();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  if (isDesktop) {
    return (
      <aside className="hidden lg:block min-h-0">
        <div className="p-6 h-full overflow-auto">
          <PointDetailsContent />
        </div>
      </aside>
    );
  }

  return (
    <PointDetailsPanelMobile open={open} onClose={handleClose}>
      <PointDetailsContent />
    </PointDetailsPanelMobile>
  );
})
