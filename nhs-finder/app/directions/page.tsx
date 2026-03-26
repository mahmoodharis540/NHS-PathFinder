"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { PathSummary, MediaItem } from "@/types/paths";
import { useTranslationMode } from "@/components/TranslationProvider";
import {
  getEffectiveLanguage,
  getTranslatedText,
  pickBestVoice,
  waitForVoices,
} from "@/lib/runtimeTranslation";

function isVideo(src: string) {
  return /\.(mp4|webm|ogg|mov)$/i.test(src);
}

export default function DirectionsPage() {
  const t = useTranslations("directions");
  const locale = useLocale();
  const { mode, targetLanguage } = useTranslationMode();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clean = (key: string) => {
    const v = searchParams.get(key) ?? "";
    return v === "undefined" ? "" : v;
  };

  const entrance = clean("entrance");
  const destination = clean("destination");

  const [path, setPath] = useState<PathSummary | null>(null);
  const [sequence, setSequence] = useState<MediaItem[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isReadingStep, setIsReadingStep] = useState(false);
  const [translatedStepText, setTranslatedStepText] = useState("");
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStepText = String(sequence[slideIndex]?.mediaDesc ?? "").trim();
  const effectiveLanguage = getEffectiveLanguage(locale, mode, targetLanguage);
  const displayedStepText = translatedStepText || currentStepText;

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!currentStepText) {
      setTranslatedStepText("");
      return;
    }

    const run = async () => {
      const nextText = await getTranslatedText(currentStepText, effectiveLanguage);
      if (!cancelled) {
        setTranslatedStepText(nextText);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [currentStepText, effectiveLanguage]);

  useEffect(() => {
    if (!speechSupported) return;

    window.speechSynthesis.cancel();
    currentUtteranceRef.current = null;
    setIsReadingStep(false);
  }, [slideIndex, speechSupported, displayedStepText]);

  useEffect(() => {
    return () => {
      if (!speechSupported) return;
      window.speechSynthesis.cancel();
    };
  }, [speechSupported]);

  useEffect(() => {
    const syncOnlineState = () => setIsOffline(!navigator.onLine);

    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);

    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!("caches" in window)) return;
    if (!entrance || !destination) return;

    const pathSearchUrl = `/api/paths?entrance=${encodeURIComponent(entrance)}&destination=${encodeURIComponent(destination)}`;

    caches.open("nhs-pathfinder-api-v1").then((cache) => {
      cache.add(pathSearchUrl).catch(() => undefined);
    });
  }, [entrance, destination]);

  useEffect(() => {
    if (!entrance || !destination) {
      setError(t("missingRouteParams"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const url = `/api/paths?entrance=${encodeURIComponent(
      entrance
    )}&destination=${encodeURIComponent(destination)}`;

    fetch(url)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          console.error("GET", url, r.status, data);
          throw new Error(data?.error ?? "API error");
        }
        return data;
      })
      .then(({ paths }) => {
        if (!paths?.length) {
          setError(t("noPathFound"));
          return;
        }
        setPath(paths[0]);
      })
      .catch((err) => {
        console.error("Failed to load path:", err);
        setError(t("failedToLoadPath"));
      })
      .finally(() => setLoading(false));
  }, [entrance, destination, t]);

  useEffect(() => {
    if (!path) return;

    setSlideIndex(0);

    const pathId = path.PathID ?? path.pathID ?? path.id;

    if (!pathId) {
      setError(t("couldNotResolvePathId"));
      return;
    }

    const seqUrl = `/api/paths/${pathId}/sequence`;

    fetch(seqUrl)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error ?? "Sequence API error");
        return data;
      })
      .then(({ mediaSequence }) => {
        setSequence(mediaSequence ?? []);

        if (!("caches" in window)) return;

        const mediaUrls = (mediaSequence ?? [])
          .map((item: MediaItem) => String(item.media ?? item.Media ?? item.url ?? ""))
          .filter(Boolean)
          .map((src: string) => new URL(src, window.location.origin).toString());

        caches.open("nhs-pathfinder-api-v1").then((cache) => {
          cache.add(seqUrl).catch(() => undefined);
        });

        caches.open("nhs-pathfinder-media-v1").then((cache) => {
          mediaUrls.forEach((src: string) => {
            cache.add(src).catch(() => undefined);
          });
        });
      })
      .catch((err) => {
        console.error("Failed to load sequence:", err);
        setError(navigator.onLine ? t("failedToLoadMedia") : t("offlineNotCached"));
      });
  }, [path, t]);

  const prev = () =>
    setSlideIndex((i) => (i - 1 + sequence.length) % sequence.length);

  const next = () =>
    setSlideIndex((i) => (i + 1) % sequence.length);

  async function toggleStepSpeech() {
    if (!speechSupported || !currentStepText) return;

    if (window.speechSynthesis.speaking || isReadingStep) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
      setIsReadingStep(false);
      return;
    }

    const textToSpeak = await getTranslatedText(currentStepText, effectiveLanguage);
    await waitForVoices();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.lang = effectiveLanguage;
    const voice = pickBestVoice(effectiveLanguage);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.onstart = () => setIsReadingStep(true);
    utterance.onend = () => {
      currentUtteranceRef.current = null;
      setIsReadingStep(false);
    };
    utterance.onerror = () => {
      currentUtteranceRef.current = null;
      setIsReadingStep(false);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#003087]">
        <div className="flex flex-col items-center gap-4 text-white">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-white/20"
            style={{ borderTopColor: "#fff" }}
          />
          <p className="text-sm">{t("findingRoute")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#003087] px-6 text-white">
        <p className="text-center text-lg">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-white px-6 py-3 font-semibold text-[#003087] transition-colors hover:bg-gray-100"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black font-sans text-white">
      <header className="shrink-0 bg-[#003087]">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/")}
            aria-label="Back"
            className="cursor-pointer border-none bg-transparent text-xl text-white/80 transition-colors hover:text-white"
          >
            ←
          </button>

          <div className="text-center">
            <p className="m-0 text-sm font-semibold">
              {entrance}
              <span className="mx-2 opacity-60">⟶</span>
              {destination}
            </p>
          </div>

          {sequence.length > 0 ? (
            <p className="m-0 text-sm tabular-nums text-white/60">
              {slideIndex + 1} / {sequence.length}
            </p>
          ) : (
            <div className="w-12" aria-hidden="true" />
          )}
        </div>

        {sequence.length > 0 && (
          <div className="px-6 pb-4">
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-label={t("journeyProgress")}
              aria-valuemin={0}
              aria-valuemax={sequence.length}
              aria-valuenow={slideIndex + 1}
            >
              <div
                className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)] transition-all duration-300 ease-in-out"
                style={{
                  width: `${((slideIndex + 1) / sequence.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="relative flex-1 overflow-hidden bg-black">
        {sequence.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/40">
            <p className="m-0 text-base">{t("noMediaAvailable")}</p>
          </div>
        )}

        {sequence.map((item, i) => (
          <div
            key={String(item.pSequenceId ?? i)}
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out"
            style={{
              opacity: i === slideIndex ? 1 : 0,
              pointerEvents: i === slideIndex ? "all" : "none",
            }}
          >
            {isVideo(String(item.media ?? "")) ? (
              <video
                key={`${item.pSequenceId}-${i === slideIndex}`}
                src={String(item.media ?? "")}
                autoPlay={i === slideIndex}
                loop
                muted
                playsInline
                className="max-h-full max-w-full select-none object-contain"
              />
            ) : (
              <img
                src={String(item.media ?? "")}
                alt={i === slideIndex ? displayedStepText : String(item.mediaDesc ?? "")}
                loading="lazy"
                className="max-h-full max-w-full select-none object-contain"
              />
            )}

            {String(item.mediaDesc ?? "") && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-24 pt-8">
                <div className="flex max-w-2xl flex-col items-start gap-3">
                  <p className="m-0 text-sm text-white/80">
                    {i === slideIndex ? displayedStepText : String(item.mediaDesc ?? "")}
                  </p>

                  <button
                    type="button"
                    onClick={toggleStepSpeech}
                    aria-label={isReadingStep ? "Stop reading this instruction" : "Read this instruction"}
                    disabled={!speechSupported || !displayedStepText || i !== slideIndex}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#003087] px-4 py-2 text-sm font-medium text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isReadingStep && i === slideIndex ? (
                      <>
                        <VolumeX className="h-5 w-5" />
                        <span>{t("stopReading")}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-5 w-5" />
                        <span>{t("readStep")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {sequence.length > 1 && (
          <button
            onClick={prev}
            title={t("previous")}
            aria-label={t("previousSlide")}
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-xl text-white backdrop-blur-sm transition-colors duration-150 hover:bg-black/70"
          >
            ←
          </button>
        )}

        {sequence.length > 1 && (
          <button
            onClick={next}
            title={t("next")}
            aria-label={t("nextSlide")}
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-xl text-white backdrop-blur-sm transition-colors duration-150 hover:bg-black/70"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
