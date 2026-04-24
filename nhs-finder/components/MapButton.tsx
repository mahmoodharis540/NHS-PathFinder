"use client";

import Link from "next/link";
import { Map } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MapButton() {
  const t = useTranslations("topBar");

  return (
    <Link
      href="/map"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white p-0 text-slate-900 shadow-lg transition hover:bg-gray-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:h-11 sm:w-11"
      aria-label={t("map")}
      title={t("map")}
    >
      <Map className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
    </Link>
  );
}
