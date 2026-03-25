"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { PersonStanding } from "lucide-react";

const STORAGE_KEY = "nhs_pathfinder_settings_v1";
const MIN_SIZE = 12;
const MAX_SIZE = 24;
const STEP = 2;

type AppSettings = {
  largeText?: number;
  highContrast?: boolean;
  reducedMotion?: boolean;
  readableFont?: boolean;
  highlightLinks?: boolean;
  screenReaderEnabled?: boolean;
};

export default function AccessibilityToolbar() {
  const pathname = usePathname();
  const [fontSize, setFontSize] = useState(16);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    largeText: 16,
    highContrast: false,
    reducedMotion: false,
    readableFont: false,
    highlightLinks: false,
    screenReaderEnabled: false,
  });
  const hideTimerRef = useRef<number | null>(null);
  const speakTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const settings = raw ? (JSON.parse(raw) as AppSettings) : {};
      const nextSize = typeof settings.largeText === "number" ? settings.largeText : 16;
      setFontSize(Math.min(MAX_SIZE, Math.max(MIN_SIZE, nextSize)));
      setSettings({
        largeText: nextSize,
        highContrast: !!settings.highContrast,
        reducedMotion: !!settings.reducedMotion,
        readableFont: !!settings.readableFont,
        highlightLinks: !!settings.highlightLinks,
        screenReaderEnabled: !!settings.screenReaderEnabled,
      });
    } catch {
      setFontSize(16);
    }

    const sync = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const settings = raw ? (JSON.parse(raw) as AppSettings) : {};
        const nextSize = typeof settings.largeText === "number" ? settings.largeText : 16;
        setFontSize(Math.min(MAX_SIZE, Math.max(MIN_SIZE, nextSize)));
        setSettings({
          largeText: nextSize,
          highContrast: !!settings.highContrast,
          reducedMotion: !!settings.reducedMotion,
          readableFont: !!settings.readableFont,
          highlightLinks: !!settings.highlightLinks,
          screenReaderEnabled: !!settings.screenReaderEnabled,
        });
      } catch {}
    };

    window.addEventListener("nhs-settings-updated", sync);
    return () => window.removeEventListener("nhs-settings-updated", sync);
  }, []);

  useEffect(() => {
    if (!speechSupported) return;

    const handleSpeechEnd = () => setIsSpeaking(false);
    window.speechSynthesis.addEventListener?.("voiceschanged", handleSpeechEnd);

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener?.("voiceschanged", handleSpeechEnd);
    };
  }, [speechSupported]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      if (speakTimerRef.current) {
        window.clearTimeout(speakTimerRef.current);
      }
    };
  }, []);

  function restartHideTimer() {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 5000);
  }

  function openToolbar() {
    setIsOpen(true);
    restartHideTimer();
  }

  function updateFontSize(direction: 1 | -1) {
    restartHideTimer();
    const nextSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, fontSize + direction * STEP));

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const settings = raw ? JSON.parse(raw) : {};

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...settings,
          largeText: nextSize,
        })
      );

      setFontSize(nextSize);
      window.dispatchEvent(new Event("nhs-settings-updated"));
    } catch {}
  }

  function updateBooleanSetting(
    key: "highContrast" | "reducedMotion" | "readableFont" | "highlightLinks"
  ) {
    restartHideTimer();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as AppSettings) : {};
      const nextValue = !current[key];

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...current,
          [key]: nextValue,
        })
      );

      setSettings((prev) => ({ ...prev, [key]: nextValue }));
      window.dispatchEvent(new Event("nhs-settings-updated"));
    } catch {}
  }

  function getReadablePageText() {
    const main = document.querySelector("main");
    const source = main ?? document.body;
    const rawText = source.textContent?.replace(/\s+/g, " ").trim() ?? "";

    if (!rawText) {
      return "There is no readable content on this page.";
    }

    return rawText.slice(0, 1800);
  }

  function speakCurrentPage() {
    if (!speechSupported) {
      setAnnouncement("Screen reader speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(getReadablePageText());
    utterance.rate = 0.95;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setAnnouncement("Screen reader speech started.");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setAnnouncement("Screen reader speech finished.");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setAnnouncement("Screen reader speech failed to start.");
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function setScreenReaderEnabled(nextValue: boolean) {
    restartHideTimer();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as AppSettings) : {};

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...current,
          screenReaderEnabled: nextValue,
        })
      );

      setSettings((prev) => ({ ...prev, screenReaderEnabled: nextValue }));
      window.dispatchEvent(new Event("nhs-settings-updated"));
    } catch {}

    if (!nextValue) {
      if (speakTimerRef.current) {
        window.clearTimeout(speakTimerRef.current);
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setAnnouncement("Screen reader speech stopped.");
      return;
    }

    setAnnouncement("Screen reader speech enabled.");
    speakCurrentPage();
  }

  useEffect(() => {
    if (!speechSupported || !settings.screenReaderEnabled) return;

    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
    }

    speakTimerRef.current = window.setTimeout(() => {
      speakCurrentPage();
    }, 300);

    return () => {
      if (speakTimerRef.current) {
        window.clearTimeout(speakTimerRef.current);
      }
    };
  }, [pathname, speechSupported, settings.screenReaderEnabled]);

  return (
    <>
      <div
        aria-live="polite"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="fixed bottom-2 right-2 z-50 sm:bottom-4 sm:right-4">
        {isOpen ? (
          <div className="w-[min(calc(100vw-1rem),28rem)] rounded-2xl bg-white p-2 text-black shadow-lg dark:bg-slate-900 dark:text-slate-100 sm:w-[min(calc(100vw-2rem),34rem)] sm:p-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              onClick={() => updateBooleanSetting("highContrast")}
              aria-label="Toggle high contrast"
              className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-medium dark:border-slate-700 sm:min-h-12 sm:px-3 sm:py-3 sm:text-sm ${settings.highContrast ? "bg-[#003087] text-white" : ""}`}
            >
              HC
            </button>
            <button
              onClick={() => updateFontSize(1)}
              aria-label="Increase text size"
              className="min-h-11 rounded-xl border px-2 py-2 text-xs font-medium dark:border-slate-700 sm:min-h-12 sm:px-3 sm:py-3 sm:text-sm"
            >
              A+
            </button>
            <button
              onClick={() => updateFontSize(-1)}
              aria-label="Decrease text size"
              className="min-h-11 rounded-xl border px-2 py-2 text-xs font-medium dark:border-slate-700 sm:min-h-12 sm:px-3 sm:py-3 sm:text-sm"
            >
              A-
            </button>
            <button
              onClick={() => updateBooleanSetting("reducedMotion")}
              aria-label="Toggle reduced motion"
              className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-medium dark:border-slate-700 sm:min-h-12 sm:px-3 sm:py-3 sm:text-sm ${settings.reducedMotion ? "bg-[#003087] text-white" : ""}`}
            >
              RM
            </button>
            <button
              onClick={() => updateBooleanSetting("readableFont")}
              aria-label="Toggle dyslexia-friendly font"
              className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-medium dark:border-slate-700 sm:min-h-12 sm:px-3 sm:py-3 sm:text-sm ${settings.readableFont ? "bg-[#003087] text-white" : ""}`}
            >
              Df
            </button>
            <button
              onClick={() => updateBooleanSetting("highlightLinks")}
              aria-label="Toggle highlighted links"
              className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-medium dark:border-slate-700 sm:min-h-12 sm:px-3 sm:py-3 sm:text-sm ${settings.highlightLinks ? "bg-[#003087] text-white" : ""}`}
            >
              🔗
            </button>
            <button
              onClick={() => setScreenReaderEnabled(!settings.screenReaderEnabled)}
              aria-label={
                settings.screenReaderEnabled ? "Disable screen reader help" : "Enable screen reader help"
              }
              className="min-h-11 rounded-xl border px-2 py-2 text-xs font-medium dark:border-slate-700 sm:min-h-12 sm:px-3 sm:py-3 sm:text-sm"
            >
              {settings.screenReaderEnabled ? "🔇" : "🔊"}
            </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openToolbar}
            aria-label="Open accessibility controls"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg dark:bg-slate-900 dark:text-slate-100 sm:h-14 sm:w-14"
          >
            <PersonStanding className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}
      </div>
    </>
  );
}
