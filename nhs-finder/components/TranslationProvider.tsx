"use client";

import { createContext, useContext, useEffect, useState } from "react";

type TranslationContextType = {
  mode: "normal" | "google";
  targetLanguage: string;
  setGoogleMode: (lang: string) => void;
  setNormalMode: () => void;
};

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<"normal" | "google">("normal");
  const [targetLanguage, setTargetLanguage] = useState("");

  useEffect(() => {
    const savedMode = localStorage.getItem("translation-mode");
    const savedLanguage = localStorage.getItem("translation-target-language");

    if (savedMode === "google" && savedLanguage) {
      setMode("google");
      setTargetLanguage(savedLanguage);
      return;
    }

    setMode("normal");
  }, []);

  const setGoogleMode = (lang: string) => {
    setMode("google");
    setTargetLanguage(lang);

    localStorage.setItem("translation-mode", "google");
    localStorage.setItem("translation-target-language", lang);

    document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000`;
  };

  const setNormalMode = () => {
    setMode("normal");
    setTargetLanguage("");

    localStorage.setItem("translation-mode", "normal");
    localStorage.removeItem("translation-target-language");

    document.cookie =
      "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "googtrans=; domain=" +
      window.location.hostname +
      "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  return (
    <TranslationContext.Provider
      value={{ mode, targetLanguage, setGoogleMode, setNormalMode }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationMode() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error("useTranslationMode must be used inside TranslationProvider");
  }

  return context;
}