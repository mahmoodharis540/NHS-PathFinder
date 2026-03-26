const memoryCache = new Map<string, string>();
const STORAGE_PREFIX = "nhs_runtime_translation_v1::";

export function normalizeSpeechLanguage(lang: string) {
  const value = (lang || "en").trim();

  switch (value) {
    case "yue":
      return "zh-HK";
    case "ckb":
      return "ckb-IQ";
    case "kmr":
      return "ku";
    case "om":
      return "om-ET";
    default:
      return value;
  }
}

export function getEffectiveLanguage(
  locale: string,
  mode: "normal" | "google",
  targetLanguage: string
) {
  if (mode === "google" && targetLanguage) {
    return normalizeSpeechLanguage(targetLanguage);
  }

  return normalizeSpeechLanguage(locale || "en");
}

export function isEnglishLike(lang: string) {
  return normalizeSpeechLanguage(lang).toLowerCase().startsWith("en");
}

function getCacheKey(targetLanguage: string, text: string) {
  return `${normalizeSpeechLanguage(targetLanguage)}::${text}`;
}

export async function getTranslatedText(text: string, targetLanguage: string) {
  if (!text) return text;

  const normalizedTarget = normalizeSpeechLanguage(targetLanguage);
  if (!normalizedTarget || isEnglishLike(normalizedTarget)) {
    return text;
  }

  const cacheKey = getCacheKey(normalizedTarget, text);

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) ?? text;
  }

  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${cacheKey}`);
      if (saved) {
        memoryCache.set(cacheKey, saved);
        return saved;
      }
    } catch {}
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        targetLanguage: normalizedTarget,
      }),
    });

    const data = await res.json();
    const translated = typeof data?.translatedText === "string" && data.translatedText.trim()
      ? data.translatedText
      : text;

    memoryCache.set(cacheKey, translated);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${cacheKey}`, translated);
      } catch {}
    }

    return translated;
  } catch {
    return text;
  }
}

export function pickBestVoice(targetLanguage: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const normalizedTarget = normalizeSpeechLanguage(targetLanguage).toLowerCase();
  const baseTarget = normalizedTarget.split("-")[0];

  if (baseTarget === "en") {
    const englishPreference = [
      "en-gb",
      "en-ie",
      "en-au",
      "en-nz",
      "en-us",
    ];
    const preferredNameHints = [
      "daniel",
      "serena",
      "samantha",
      "karen",
      "moira",
      "tessa",
      "arthur",
    ];

    for (const lang of englishPreference) {
      const exact = voices.find((voice) => voice.lang.toLowerCase() === lang);
      if (exact) return exact;

      const byHint = voices.find(
        (voice) =>
          voice.lang.toLowerCase().startsWith(lang) &&
          preferredNameHints.some((hint) =>
            voice.name.toLowerCase().includes(hint)
          )
      );
      if (byHint) return byHint;
    }

    const anyPreferredEnglish = voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith("en-") &&
        preferredNameHints.some((hint) =>
          voice.name.toLowerCase().includes(hint)
        )
    );
    if (anyPreferredEnglish) return anyPreferredEnglish;
  }

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedTarget) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${baseTarget}-`)) ||
    voices.find((voice) => voice.lang.toLowerCase() === baseTarget) ||
    null
  );
}


export function waitForVoices(timeoutMs = 1000) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([] as SpeechSynthesisVoice[]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener?.("voiceschanged", handleVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };

    const handleVoicesChanged = () => finish();

    window.speechSynthesis.addEventListener?.("voiceschanged", handleVoicesChanged);
    window.setTimeout(finish, timeoutMs);
  });
}
