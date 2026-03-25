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
      className="rounded-full border border-black/10 bg-white/90 p-3 text-slate-900 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
