"use client";

import { useEffect } from "react";

const STORAGE_KEY = "nhs_pathfinder_settings_v1";

export default function HighContrastProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function applyHighContrast() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const settings = raw ? JSON.parse(raw) : {};
        const enabled = settings.highContrast ?? false;
        document.documentElement.classList.toggle("high-contrast", enabled);
      } catch {}
    }

    applyHighContrast();
    window.addEventListener("nhs-settings-updated", applyHighContrast);
    return () => window.removeEventListener("nhs-settings-updated", applyHighContrast);
  }, []);

  return <>{children}</>;
}