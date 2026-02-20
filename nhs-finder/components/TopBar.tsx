"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TopBar() {
  const t = useTranslations("topBar");

  return (
    <header className="absolute top-0 left-0 w-full p-4 flex items-center justify-between">
      {/* Left side */}
      <Link
        href="/login"
        className="text-white border border-white px-4 py-1 rounded hover:bg-white hover:text-[#003087] transition"
      >
        {t("staffPortal")}
      </Link>

      {/* Right side */}
      <Link
        href="/settings"
        className="text-white hover:opacity-80"
        aria-label={t("settings")}
      >
        <Settings className="h-6 w-6" />
      </Link>
    </header>
  );
}
