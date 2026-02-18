"use client";

import MainDropdown from "@/components/BuildingLocationDropdown";
import TopBar from "@/components/TopBar";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import Languages from "@/components/Languages";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");
  return (
    <main className="min-h-screen bg-[#003087] text-white relative">
      <TopBar />
      <div className="absolute bottom-4 left-4">
        <Languages />
      </div>
      <div className="flex flex-col items-center justify-center text-center min-h-screen px-4">
        <h1 className="text-3xl font-bold mb-2">{t("welcome")}</h1>
        <p className="text-sm italic mb-6">{t("subtitle")}</p>
        <p className="mb-6">{t("prompt")}</p>
        <MainDropdown />
      </div>
      <AccessibilityToolbar />
    </main>
  );
}
