"use client";

import { useEffect } from "react";

const STORAGE_KEY = "nhs_pathfinder_settings_v1";

type AppSettings = {
  highContrast?: boolean;
  reducedMotion?: boolean;
  readableFont?: boolean;
  highlightLinks?: boolean;
};

export default function HighContrastProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function applyAccessibilitySettings() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const settings = raw ? (JSON.parse(raw) as AppSettings) : {};
        document.documentElement.classList.toggle("high-contrast", !!settings.highContrast);
        document.documentElement.classList.toggle("reduce-motion", !!settings.reducedMotion);
        document.documentElement.classList.toggle("readable-font", !!settings.readableFont);
        document.documentElement.classList.toggle("highlight-links", !!settings.highlightLinks);
      } catch {}
    }

    applyAccessibilitySettings();
    window.addEventListener("nhs-settings-updated", applyAccessibilitySettings);
    return () => window.removeEventListener("nhs-settings-updated", applyAccessibilitySettings);
  }, []);

  return <>{children}</>;
}
