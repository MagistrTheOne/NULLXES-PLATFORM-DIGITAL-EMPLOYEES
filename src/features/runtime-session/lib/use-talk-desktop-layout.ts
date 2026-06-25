"use client";

import { useEffect, useState } from "react";

const TALK_DESKTOP_MEDIA_QUERY = "(min-width: 900px)";

export function useTalkDesktopLayout(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(TALK_DESKTOP_MEDIA_QUERY);
    const sync = () => setIsDesktop(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return isDesktop;
}
