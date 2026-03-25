"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { toggleTheme } from "@/components/ThemeProvider";

export default function ThemeToggleButton() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };

    syncTheme();
    window.addEventListener("nhs-settings-updated", syncTheme);

    return () => window.removeEventListener("nhs-settings-updated", syncTheme);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        toggleTheme();
        setTheme((current) => (current === "dark" ? "light" : "dark"));
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 p-2 text-slate-900 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100 sm:h-12 sm:w-12 sm:p-3"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
    </button>
  );
}
