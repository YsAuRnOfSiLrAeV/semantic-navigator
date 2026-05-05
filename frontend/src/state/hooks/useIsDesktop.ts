import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia(DESKTOP_QUERY);

    const syncDesktopState = () => {
      setIsDesktop(desktopMediaQuery.matches);
    };

    syncDesktopState();

    desktopMediaQuery.addEventListener("change", syncDesktopState);
    return () => {
      desktopMediaQuery.removeEventListener("change", syncDesktopState);
    };
  }, []);

  return isDesktop;
}
