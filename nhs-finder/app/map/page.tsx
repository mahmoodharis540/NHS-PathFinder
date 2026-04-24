"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Map as MapIcon } from "lucide-react";

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#003087] text-white shadow">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="relative flex items-center justify-center">
            <Link
              href="/"
              className="absolute left-0 inline-flex items-center gap-2 rounded-md px-3 py-2 text-white/90 hover:bg-white/10 transition"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>

            <div className="text-center">
              <h1 className="text-2xl font-semibold leading-tight">
                Hospital Map
              </h1>
              <p className="text-sm text-white/80">
                View the hospital site map
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#003087]">
              <MapIcon className="h-5 w-5 text-white" />
            </span>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Site Map
              </h2>
              <p className="text-sm text-gray-500">
                Use this map to get a general overview of the hospital grounds.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <Image
              src="/uploads/hospitalmap.jpg"
              alt="Hospital site map"
              width={1400}
              height={900}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </section>
      </main>
    </div>
  );
}