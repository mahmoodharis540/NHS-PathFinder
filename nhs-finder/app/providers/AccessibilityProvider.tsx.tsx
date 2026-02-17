"use client";

import { useEffect } from "react";

const STORAGE_KEY = "nhs_pathfinder_settings_v1";

type AppSettings = {
  highContrast?: boolean;
  largeText?: boolean;
  reducedMotion?: boolean;
  language?: string;
  defaultBuilding?: string;
};

function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppSettings) : {};
  } catch {
    return {};
  }
}

export default function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const apply = () => {
      const s = readSettings();

      // Toggle body classes
      document.body.classList.toggle("hc", !!s.highContrast);
      document.body.classList.toggle("large-text", !!s.largeText);
      document.body.classList.toggle("reduce-motion", !!s.reducedMotion);

      // If you want language direction support (Arabic):
      // (Optional) set dir="rtl" for Arabic
      if (s.language === "ar") {
        document.documentElement.dir = "rtl";
      } else {
        document.documentElement.dir = "ltr";
      }
    };

    apply();

    // Re-apply when our settings page saves
    window.addEventListener("nhs-settings-updated", apply);

    return () => window.removeEventListener("nhs-settings-updated", apply);
  }, []);

  return <>{children}</>;
}
