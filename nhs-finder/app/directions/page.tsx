"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PathSummary, MediaItem } from "@/types/paths";

function isVideo(src: string) {
  return /\.(mp4|webm|ogg|mov)$/i.test(src);
}

export default function DirectionsPage() {
  const t = useTranslations("directions");
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
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isReadingStep, setIsReadingStep] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStepText = String(sequence[slideIndex]?.mediaDesc ?? "").trim();

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (!speechSupported) return;

    window.speechSynthesis.cancel();
    currentUtteranceRef.current = null;
    setIsReadingStep(false);
  }, [slideIndex, speechSupported]);

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

    console.log("Selected path object:", path);
    const pathId = path.PathID ?? path.pathID ?? path.id;
    console.log("Resolved PathID:", pathId);

    if (!pathId) {
      setError(t("couldNotResolvePathId"));
      return;
    }

    const seqUrl = `/api/paths/${pathId}/sequence`;

    fetch(seqUrl)
      .then(async (r) => {
        const data = await r.json();
        console.log("Sequence response:", r.status, data);
        if (!r.ok) throw new Error(data?.error ?? "Sequence API error");
        return data;
      })
      .then(({ mediaSequence }) => {
        console.log(
          "Media sequence length:",
          mediaSequence?.length,
          mediaSequence
        );
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
        setError(
          navigator.onLine
            ? t("failedToLoadMedia")
            : t("offlineNotCached")
        );
      });
  }, [path, t]);

  const prev = () =>
    setSlideIndex((i) => (i - 1 + sequence.length) % sequence.length);

  const next = () =>
    setSlideIndex((i) => (i + 1) % sequence.length);

  function toggleStepSpeech() {
    if (!speechSupported || !currentStepText) return;

    if (window.speechSynthesis.speaking || isReadingStep) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
      setIsReadingStep(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentStepText);
    utterance.rate = 0.95;
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
            className="w-10 h-10 rounded-full border-4 border-white/20 animate-spin"
            style={{ borderTopColor: "#fff" }}
          />
          <p className="text-sm">{t("findingRoute")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#003087] text-white px-6">
        <p className="text-lg text-center">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-lg bg-white text-[#003087] font-semibold hover:bg-gray-100 transition-colors"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-white font-sans">
      <header className="shrink-0 bg-[#003087]">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/")}
            aria-label="Go back"
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            ← Back
          </button>

          <div className="text-center">
            <p className="m-0 text-sm font-semibold">
              {entrance}
              <span className="mx-2 opacity-60">⟶</span>
              {destination}
            </p>
          </div>

          {sequence.length > 0 && (
            <p className="m-0 text-sm tabular-nums text-white/60">
              {slideIndex + 1} / {sequence.length}
            </p>
          )}
        </div>

        {sequence.length > 0 && (
          <div className="px-6 pb-4">
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-label="Journey progress"
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
                className="max-w-full max-h-full object-contain select-none"
              />
            ) : (
              <img
                src={String(item.media ?? "")}
                alt={String(item.mediaDesc ?? "")}
                loading="lazy"
                className="max-w-full max-h-full object-contain select-none"
              />
            )}

            {String(item.mediaDesc ?? "") && (
              <div className="absolute bottom-0 left-0 right-0 px-6 pt-8 pb-24 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex max-w-2xl flex-col items-start gap-3">
                  <p className="m-0 text-sm text-white/80">
                    {String(item.mediaDesc ?? "")}
                  </p>

                  <button
                    type="button"
                    onClick={toggleStepSpeech}
                    aria-label={isReadingStep ? "Stop reading this instruction" : "Read this instruction"}
                    disabled={!speechSupported || !currentStepText || i !== slideIndex}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#003087] px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-[#00256a] disabled:cursor-not-allowed disabled:opacity-50"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xl cursor-pointer transition-colors duration-150"
          >
            ←
          </button>
        )}

        {sequence.length > 1 && (
          <button
            onClick={next}
            title={t("next")}
            aria-label={t("nextSlide")}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xl cursor-pointer transition-colors duration-150"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
