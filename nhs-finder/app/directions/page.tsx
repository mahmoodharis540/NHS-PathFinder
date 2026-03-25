"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BfsLeg {
  pathId:    number;
  pathName:  string;
  start:     number;
  end:       number;
  startName: string | null;
  endName:   string | null;
}

interface MediaItem {
  pSequenceId: number;
  mediaId:     number;
  media:       string;
  mediaDesc:   string;
}

interface RouteLeg {
  pathId:    number;
  startName: string;
  endName:   string;
  media:     MediaItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isVideo(src: string) {
  return /\.(mp4|webm|ogg|mov)$/i.test(src);
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function DirectionsInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const clean = (key: string) => {
    const v = searchParams.get(key) ?? "";
    return v === "undefined" ? "" : v;
  };

  const entranceName    = clean("entrance");
  const destinationName = clean("destination");

  // Route state
  const [legs,         setLegs]         = useState<RouteLeg[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // Slideshow state
  const [activeLeg,    setActiveLeg]    = useState(0);
  const [activeSlide,  setActiveSlide]  = useState(0);
  const [slideDir,     setSlideDir]     = useState<"next" | "prev">("next");
  const [animating,    setAnimating]    = useState(false);

  // ── Fetch route from /api/bfs, then fetch media per leg ───────────────────
  useEffect(() => {
    if (!entranceName || !destinationName) {
      setError("Missing start or destination. Please go back and try again.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ entrance: entranceName, destination: destinationName });

    fetch(`/api/bfs?${params}`)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Unknown error from route API");
        }

        // Already there — no legs needed
        if (data.message === "Already there!") {
          setLegs([]);
          return;
        }

        const bfsLegs: BfsLeg[] = data.legs ?? [];

        // Fetch media sequence for every leg in parallel
        const legData: RouteLeg[] = await Promise.all(
          bfsLegs.map(async (leg) => {
            const seqRes  = await fetch(`/api/paths/${leg.pathId}/sequence`);
            const seqData = await seqRes.json();
            return {
              pathId:    leg.pathId,
              startName: leg.startName ?? `#${leg.start}`,
              endName:   leg.endName   ?? `#${leg.end}`,
              media:     (seqData.mediaSequence ?? []) as MediaItem[],
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
  }, [entranceName, destinationName]);

  // ── Slide navigation ──────────────────────────────────────────────────────
  const currentMedia = legs[activeLeg]?.media ?? [];
  const totalSlides  = currentMedia.length;

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
      if (e.key === "ArrowLeft")  goSlide("prev");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goSlide]);

  // ── Loading ───────────────────────────────────────────────────────────────
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
          ← Go Back
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
  const progressPct  = totalSlides > 1 ? (activeSlide / (totalSlides - 1)) * 100 : 100;

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
              <span className={[
                "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                activeLeg === idx ? "bg-white text-[#003087]" : "bg-white/20 text-white",
              ].join(" ")}>
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
            <p className="text-white/40 text-base">No media for this path segment.</p>
          </div>
        )}

        {currentMedia.map((item, i) => (
          <div
            key={`${item.pSequenceId}-${i}`}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity:       i === activeSlide ? 1 : 0,
              transition:    "opacity 0.3s ease",
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
