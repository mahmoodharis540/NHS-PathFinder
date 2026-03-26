"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BfsLeg {
  pathId: number;
  pathName: string;
  start: number;
  end: number;
  startName: string | null;
  endName: string | null;
}

interface MediaItem {
  pSequenceId: number;
  mediaId: number;
  media: string;
  mediaDesc: string;
}

interface RouteLeg {
  pathId: number;
  startName: string;
  endName: string;
  media: MediaItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { PathSummary, MediaItem } from "@/types/paths";
import { useTranslationMode } from "@/components/TranslationProvider";
import { getEffectiveLanguage, getTranslatedText, pickBestVoice, waitForVoices } from "@/lib/runtimeTranslation";

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

  const entranceName = clean("entrance");
  const destinationName = clean("destination");
  const accessible = clean("accessible") === "true";

  // Route state
  const [legs, setLegs] = useState<RouteLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Slideshow state
  const [activeLeg, setActiveLeg] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);

  // ── Fetch route from /api/bfs, then fetch media per leg ───────────────────
  useEffect(() => {
    if (!entranceName || !destinationName) {
      setError("Missing start or destination. Please go back and try again.");
    if (!entrance || !destination) {
      setError(t("missingRouteParams"));
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      entrance: entranceName,
      destination: destinationName,
      accessible: String(accessible),
    });

    fetch(`/api/bfs?${params}`)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Unknown error from route API");
        }

        // Already there — no legs needed
        if (data.message === "Already there!") {
          setLegs([]);
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

        const bfsLegs: BfsLeg[] = data.legs ?? [];

        // Fetch media sequence for every leg in parallel
        const legData: RouteLeg[] = await Promise.all(
          bfsLegs.map(async (leg) => {
            const seqRes = await fetch(`/api/paths/${leg.pathId}/sequence`);
            const seqData = await seqRes.json();
            return {
              pathId: leg.pathId,
              startName: leg.startName ?? `#${leg.start}`,
              endName: leg.endName ?? `#${leg.end}`,
              media: (seqData.mediaSequence ?? []) as MediaItem[],
            };
          })
        );

        setLegs(legData);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message ?? "Failed to load route data. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [entranceName, destinationName, accessible]);

  // ── Slide navigation ──────────────────────────────────────────────────────
  const currentMedia = legs[activeLeg]?.media ?? [];
  const totalSlides = currentMedia.length;

  const goSlide = useCallback(
    (dir: "next" | "prev") => {
      if (animating) return;
      setSlideDir(dir);
      setAnimating(true);
      setTimeout(() => {
        setActiveSlide((s) =>
          dir === "next"
            ? Math.min(s + 1, totalSlides - 1)
            : Math.max(s - 1, 0)
        );
        setAnimating(false);
      }, 300);
    },
    [animating, totalSlides]
  );

  const goLeg = (idx: number) => {
    setActiveLeg(idx);
    setActiveSlide(0);
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goSlide("next");
      if (e.key === "ArrowLeft") goSlide("prev");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goSlide]);

  // ── Loading ───────────────────────────────────────────────────────────────
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
            className="w-10 h-10 rounded-full border-4 border-white/20 animate-spin"
            style={{ borderTopColor: "#fff" }}
          />
          <p className="text-sm font-medium tracking-wide">
            Calculating your route…
          </p>
          <p className="text-xs text-white/50">Using Weighted Shortest Path</p>
          <p className="text-sm">{t("findingRoute")}</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#003087] text-white px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">🗺️</p>
          <p className="text-lg font-semibold mb-2">Route unavailable</p>
          <p className="text-sm text-white/70">{error}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-lg bg-white text-[#003087] font-semibold hover:bg-gray-100 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  // ── Already there ─────────────────────────────────────────────────────────
  if (legs.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#003087] text-white px-6">
        <p className="text-4xl">📍</p>
        <p className="text-lg font-semibold">You&apos;re already there!</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-lg bg-white text-[#003087] font-semibold hover:bg-gray-100 transition-colors"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  const currentSlide = currentMedia[activeSlide];
  const progressPct =
    totalSlides > 1 ? (activeSlide / (totalSlides - 1)) * 100 : 100;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-white">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 bg-[#003087] gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors bg-transparent border-none cursor-pointer shrink-0"
        >
          ← Back
        </button>

        <div className="text-center min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">
            {entranceName}
            <span className="mx-2 opacity-50">⟶</span>
            {destinationName}
          </p>
          {legs.length > 1 && (
            <p className="text-xs text-white/50 mt-0.5">
              {legs.length}-leg route · shortest weighted path
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-white font-sans">
      <header className="shrink-0 bg-[#003087]">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/")}
            aria-label="Back"
            className="flex items-center justify-start text-xl text-white/80 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
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

          {sequence.length > 0 && (
            <p className="m-0 text-sm tabular-nums text-white/60">
              {slideIndex + 1} / {sequence.length}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          {totalSlides > 0 && (
            <p className="text-sm tabular-nums text-white/60">
              {activeSlide + 1} / {totalSlides}
            </p>
          )}
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-white/10 shrink-0">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Route legs (if multi-leg) ── */}
      {legs.length > 1 && (
        <div className="flex gap-0 bg-[#001f5c] shrink-0 overflow-x-auto scrollbar-none">
          {legs.map((leg, idx) => (
            <button
              key={leg.pathId}
              onClick={() => goLeg(idx)}
              className={[
                "flex items-center gap-2 px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer bg-transparent",
                activeLeg === idx
                  ? "border-white text-white"
                  : "border-transparent text-white/50 hover:text-white/80",
              ].join(" ")}
            >
              <span
                className={[
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  activeLeg === idx
                    ? "bg-white text-[#003087]"
                    : "bg-white/20 text-white",
                ].join(" ")}
              >
                {idx + 1}
              </span>
              {leg.startName} → {leg.endName}
            </button>
          ))}
        </div>
      )}

      {/* ── Slide viewport ── */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {totalSlides === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/40 text-base">
              No media for this path segment.
            </p>
          </div>
        )}

        {currentMedia.map((item, i) => (
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
            key={`${item.pSequenceId}-${i}`}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: i === activeSlide ? 1 : 0,
              transition: "opacity 0.3s ease",
              pointerEvents: i === activeSlide ? "all" : "none",
            }}
          >
            {isVideo(item.media) ? (
              <video
                key={`${item.pSequenceId}-${i === activeSlide}`}
                src={item.media}
                autoPlay={i === activeSlide}
                loop
                muted
                playsInline
                className="max-w-full max-h-full object-contain select-none"
              />
            ) : (
              <img
                src={item.media}
                alt={item.mediaDesc}
                src={String(item.media ?? "")}
                alt={i === slideIndex ? displayedStepText : String(item.mediaDesc ?? "")}
                loading="lazy"
                className="max-w-full max-h-full object-contain select-none"
              />
            )}

            {/* Caption gradient */}
            {item.mediaDesc && (
              <div className="absolute bottom-0 left-0 right-0 px-6 pt-16 pb-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <p className="text-sm text-white/80 max-w-xl leading-relaxed">
                  {item.mediaDesc}
                </p>
            {String(item.mediaDesc ?? "") && (
              <div className="absolute bottom-0 left-0 right-0 px-6 pt-8 pb-24 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex max-w-2xl flex-col items-start gap-3">
                  <p className="m-0 text-sm text-white/80">
                    {i === slideIndex ? displayedStepText : String(item.mediaDesc ?? "")}
                  </p>

                  <button
                    type="button"
                    onClick={toggleStepSpeech}
                    aria-label={isReadingStep ? "Stop reading this instruction" : "Read this instruction"}
                    disabled={!speechSupported || !displayedStepText || i !== slideIndex}
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

        {/* Prev arrow */}
        {totalSlides > 1 && (
          <button
            onClick={() => goSlide("prev")}
            disabled={activeSlide === 0}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white text-lg cursor-pointer transition-all disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-sm"
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

        {/* Next arrow */}
        {totalSlides > 1 && (
          <button
            onClick={() => goSlide("next")}
            disabled={activeSlide === totalSlides - 1}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white text-lg cursor-pointer transition-all disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-sm"
            onClick={next}
            title={t("next")}
            aria-label={t("nextSlide")}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xl cursor-pointer transition-colors duration-150"
          >
            →
          </button>
        )}

        {/* Dot indicators */}
        {totalSlides > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {currentMedia.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setSlideDir(i > activeSlide ? "next" : "prev");
                  setActiveSlide(i);
                }}
                className={[
                  "rounded-full transition-all cursor-pointer border-none",
                  i === activeSlide
                    ? "w-5 h-2 bg-white"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70",
                ].join(" ")}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense (required for useSearchParams) ────────────────

export default function DirectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#003087]">
          <div className="flex flex-col items-center gap-4 text-white">
            <div
              className="w-10 h-10 rounded-full border-4 border-white/20 animate-spin"
              style={{ borderTopColor: "#fff" }}
            />
            <p className="text-sm">Loading…</p>
          </div>
        </div>
      }
    >
      <DirectionsInner />
    </Suspense>
  );
}
