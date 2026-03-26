"use client";

import { useEffect } from "react";

const STORAGE_KEY = "nhs_pathfinder_settings_v1";

type AppSettings = {
  theme?: "light" | "dark";
};

function applyTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const settings = raw ? (JSON.parse(raw) as AppSettings) : {};
    const theme = settings.theme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.classList.remove("dark");
    document.documentElement.dataset.theme = "light";
  }
}

export function toggleTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    const nextTheme = settings.theme === "dark" ? "light" : "dark";

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...settings,
        theme: nextTheme,
      })
    );

    window.dispatchEvent(new Event("nhs-settings-updated"));
    applyTheme();
  } catch {}
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme();
    window.addEventListener("nhs-settings-updated", applyTheme);

    return () => window.removeEventListener("nhs-settings-updated", applyTheme);
  }, []);

  return <>{children}</>;
}
