"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { PathSummary, MediaItem } from "@/types/paths";


function isVideo(src: string) {
  return /\.(mp4|webm|ogg|mov)$/i.test(src);
}


export default function DirectionsPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const clean = (key: string) => {
    const v = searchParams.get(key) ?? "";
    return v === "undefined" ? "" : v;
  };
  const entrance    = clean("entrance");
  const destination = clean("destination");

  const [path, setPath]           = useState<PathSummary | null>(null);
  const [sequence, setSequence]   = useState<MediaItem[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!entrance || !destination) {
      setError("Missing start or destination. Please go back and try again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const url = `/api/paths?entrance=${encodeURIComponent(entrance)}&destination=${encodeURIComponent(destination)}`;
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
          setError("No path found between these locations.");
          return;
        }
        setPath(paths[0]);
      })
      .catch((err) => {
        console.error("Failed to load path:", err);
        setError("Failed to load path. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [entrance, destination]);
  useEffect(() => {
    if (!path) return;
    setSlideIndex(0);

    console.log("Selected path object:", path);
    const pathId = path.PathID ?? path.pathID ?? path.id;
    console.log("Resolved PathID:", pathId);
    if (!pathId) {
      setError("Could not resolve path ID.");
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
        console.log("Media sequence length:", mediaSequence?.length, mediaSequence);
        setSequence(mediaSequence ?? []);
      })
      .catch((err) => {
        console.error("Failed to load sequence:", err);
        setError("Failed to load media for this path.");
      });
  }, [path]);

  const prev = () =>
    setSlideIndex((i) => (i - 1 + sequence.length) % sequence.length);
  const next = () =>
    setSlideIndex((i) => (i + 1) % sequence.length);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#003087]">
        <div className="flex flex-col items-center gap-4 text-white">
          <div
            className="w-10 h-10 rounded-full border-4 border-white/20 animate-spin"
            style={{ borderTopColor: "#fff" }}
          />
          <p className="text-sm">Finding your route…</p>
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
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-white font-sans">

   
      <header className="flex items-center justify-between px-6 py-4 shrink-0 bg-[#003087]">
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
      </header>

    
      <div className="relative flex-1 overflow-hidden bg-black">

        {sequence.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/40">
            <p className="m-0 text-base">No media available for this path.</p>
          </div>
        )}
        {sequence.map((item, i) => (
          <div
            key={item.pSequenceId}
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out"
            style={{
              opacity: i === slideIndex ? 1 : 0,
              pointerEvents: i === slideIndex ? "all" : "none",
            }}
          >
            {isVideo(item.media) ? (
              <video
                key={`${item.pSequenceId}-${i === slideIndex}`}
                src={item.media}
                autoPlay={i === slideIndex}
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

            {item.mediaDesc && (
              <div className="absolute bottom-0 left-0 right-0 px-6 pt-8 pb-24 bg-gradient-to-t from-black/80 to-transparent">
                <p className="m-0 text-sm text-white/70 max-w-xl">
                  {item.mediaDesc}
                </p>
              </div>
            )}
          </div>
        ))}


        {sequence.length > 1 && (
          <button
            onClick={prev}
            title="Previous"
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xl cursor-pointer transition-colors duration-150"
          >
            ←
          </button>
        )}

        {sequence.length > 1 && (
          <button
            onClick={next}
            title="Next"
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xl cursor-pointer transition-colors duration-150"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}