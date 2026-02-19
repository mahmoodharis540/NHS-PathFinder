"use client";

import { useEffect } from "react";

const STORAGE_KEY = "nhs_pathfinder_settings_v1";

export default function FontProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function applyFont() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const settings = raw ? JSON.parse(raw) : {};
        const size = settings.largeText ?? 16;
        document.documentElement.style.setProperty("--nhs-text-size", `${size}px`);
      } catch {}
    }

    applyFont();

    // Re-apply whenever settings are saved
    window.addEventListener("nhs-settings-updated", applyFont);
    return () => window.removeEventListener("nhs-settings-updated", applyFont);
  }, []);

  return <>{children}</>;
}