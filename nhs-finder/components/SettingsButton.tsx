"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SettingsButton() {
  const t = useTranslations("topBar");

  return (
    <Link
      href="/settings"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white p-0 text-slate-900 shadow-lg transition hover:bg-gray-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      aria-label={t("settings")}
      title={t("settings")}
    >
      <Settings className="h-5 w-5 shrink-0" />
    </Link>
  );
}
