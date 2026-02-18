"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Step = { mediaId: number; url: string; desc: string };

export default function DirectionsPage() {
  const params = useSearchParams();
  const router = useRouter();

  const entrance = params.get("entrance") ?? "";
  const destination = params.get("destination") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pathName, setPathName] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);

  const current = steps[index];

  const isVideo = useMemo(() => {
    if (!current?.url) return false;
    return /\.(mp4|webm|ogg|mov)$/i.test(current.url);
  }, [current?.url]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/route?entrance=${encodeURIComponent(entrance)}&destination=${encodeURIComponent(destination)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Failed to load route (${res.status})`);
        }

        const data = await res.json();

        if (!cancelled) {
          setPathName(data.pathName ?? "Route");
          setSteps(data.steps ?? []);
          setIndex(0);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load route");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (entrance && destination) load();
    else {
      setLoading(false);
      setError("Missing entrance or destination in the URL.");
    }

    return () => {
      cancelled = true;
    };
  }, [entrance, destination]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading route…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <button className="mb-4 underline" onClick={() => router.push("/")}>
          ← back home
        </button>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!steps.length) {
    return (
      <div className="min-h-screen p-6">
        <button className="mb-4 underline" onClick={() => router.push("/")}>
          ← back home
        </button>
        <p>No media steps found for this route.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <button className="mb-4 underline" onClick={() => router.push("/")}>
        ← back home
      </button>

      <h1 className="text-2xl font-semibold mb-2">{pathName}</h1>
      <p className="mb-6 text-sm opacity-80">
        {entrance} → {destination}
      </p>

      <div className="rounded-xl overflow-hidden bg-black mb-4">
        {isVideo ? (
          <video controls className="w-full h-auto">
            <source src={current.url} />
            Your browser does not support video.
          </video>
        ) : (
          // For now plain img is simplest (works with /public/uploads paths)
          <img src={current.url} alt={current.desc || "Route step"} className="w-full h-auto" />
        )}
      </div>

      <p className="mb-4">{current.desc}</p>

      <div className="flex items-center gap-3">
        <button
          className="px-4 py-2 rounded bg-gray-200"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Previous
        </button>

        <div className="text-sm opacity-80">
          Step {index + 1} of {steps.length}
        </div>

        <button
          className="px-4 py-2 rounded bg-gray-200"
          onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
          disabled={index === steps.length - 1}
        >
          Next
        </button>
      </div>
    </main>
  );
}
