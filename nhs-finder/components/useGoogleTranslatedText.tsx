"use client";

import { useEffect, useState } from "react";
import { useTranslationMode } from "@/components/TranslationProvider";

const cache = new Map<string, string>();

export default function useGoogleTranslatedText(text: string) {
  const { mode, targetLanguage } = useTranslationMode();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (!text) {
      setTranslated(text);
      return;
    }

    if (mode !== "google") {
      setTranslated(text);
      return;
    }

    const cacheKey = `${targetLanguage}::${text}`;

    if (cache.has(cacheKey)) {
      setTranslated(cache.get(cacheKey)!);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            targetLanguage,
          }),
        });

        const data = await res.json();
        const nextText = data?.translatedText || text;

        cache.set(cacheKey, nextText);

        if (!cancelled) {
          setTranslated(nextText);
        }
      } catch {
        if (!cancelled) {
          setTranslated(text);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [text, mode, targetLanguage]);

  return translated;
}