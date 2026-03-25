"use client";

import { useState, useEffect, useRef } from "react";
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
};

export default function AccessibilityToolbar() {
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
  });
  const hideTimerRef = useRef<number | null>(null);

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

  function toggleScreenReaderHelp() {
    restartHideTimer();
    if (!speechSupported) {
      setAnnouncement("Screen reader speech is not supported in this browser.");
      return;
    }

    if (window.speechSynthesis.speaking || isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setAnnouncement("Screen reader speech stopped.");
      return;
    }

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

  return (
    <>
      <div
        aria-live="polite"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="fixed bottom-4 right-4 z-50">
        {isOpen ? (
          <div className="w-[min(calc(100vw-2rem),34rem)] rounded-2xl bg-white p-3 text-black shadow-lg dark:bg-slate-900 dark:text-slate-100">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              onClick={() => updateBooleanSetting("highContrast")}
              aria-label="Toggle high contrast"
              className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-medium dark:border-slate-700 ${settings.highContrast ? "bg-[#003087] text-white" : ""}`}
            >
              HC
            </button>
            <button
              onClick={() => updateFontSize(1)}
              aria-label="Increase text size"
              className="min-h-12 rounded-xl border px-3 py-3 text-sm font-medium dark:border-slate-700"
            >
              A+
            </button>
            <button
              onClick={() => updateFontSize(-1)}
              aria-label="Decrease text size"
              className="min-h-12 rounded-xl border px-3 py-3 text-sm font-medium dark:border-slate-700"
            >
              A-
            </button>
            <button
              onClick={() => updateBooleanSetting("reducedMotion")}
              aria-label="Toggle reduced motion"
              className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-medium dark:border-slate-700 ${settings.reducedMotion ? "bg-[#003087] text-white" : ""}`}
            >
              RM
            </button>
            <button
              onClick={() => updateBooleanSetting("readableFont")}
              aria-label="Toggle dyslexia-friendly font"
              className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-medium dark:border-slate-700 ${settings.readableFont ? "bg-[#003087] text-white" : ""}`}
            >
              Df
            </button>
            <button
              onClick={() => updateBooleanSetting("highlightLinks")}
              aria-label="Toggle highlighted links"
              className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-medium dark:border-slate-700 ${settings.highlightLinks ? "bg-[#003087] text-white" : ""}`}
            >
              🔗
            </button>
            <button
              onClick={toggleScreenReaderHelp}
              aria-label={isSpeaking ? "Stop screen reader help" : "Start screen reader help"}
              className="min-h-12 rounded-xl border px-3 py-3 text-sm font-medium dark:border-slate-700"
            >
              {isSpeaking ? "🔇" : "🔊"}
            </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openToolbar}
            aria-label="Open accessibility controls"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg dark:bg-slate-900 dark:text-slate-100"
          >
            <PersonStanding className="h-6 w-6" />
          </button>
        )}
      </div>
    </>
  );
}
