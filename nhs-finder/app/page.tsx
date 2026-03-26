"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import Languages from "@/components/Languages";
import SearchDropdown from "@/components/SearchDropdown";
import { useTranslations } from "next-intl";
import useGoogleTranslatedText from "@/components/useGoogleTranslatedText";
import { useTranslationMode } from "@/components/TranslationProvider";

export default function HomePage() {
  const t = useTranslations("home");
  const router = useRouter();
  const { mode } = useTranslationMode();

  const [accessible, setAccessible] = useState(false);
  const [entrance, setEntrance] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);

  const pathfinderText = useGoogleTranslatedText(t("pathfinder"));
  const subtitleText = useGoogleTranslatedText(t("subtitle"));
  const promptText = useGoogleTranslatedText(t("prompt"));
  const whereAreYouLabel = useGoogleTranslatedText(t("whereAreYouLabel"));
  const whereAreYouPlaceholder = useGoogleTranslatedText(
    t("whereAreYouPlaceholder")
  );
  const appointmentLabel = useGoogleTranslatedText(
    t("appointmentBuildingLabel")
  );
  const appointmentPlaceholder = useGoogleTranslatedText(
    t("appointmentBuildingPlaceholder")
  );
  const accessibleRouteText = useGoogleTranslatedText(t("accessibleRoute"));
  const startNavigationText = useGoogleTranslatedText(t("startNavigation"));

  const handleStartNavigation = () => {
    if (!entrance || !destination) return;

    router.push(
      `/directions?entrance=${encodeURIComponent(
        entrance.DestinationName
      )}&destination=${encodeURIComponent(destination.DestinationName)}`
    );
  };

  return (
    <main className="min-h-screen bg-[#003087] text-white relative">
      <TopBar />

      <div className="absolute bottom-4 left-4">
        <Languages />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-10 flex flex-col items-center">
          <Image
            src="/NHSlogo.png"
            alt={t("nhsLogoAlt")}
            width={160}
            height={70}
            priority
          />

          <h1 className="font-bold mt-6">{pathfinderText}</h1>

          <p className="italic mt-2 mb-4">{subtitleText}</p>
          <p>{promptText}</p>

          {mode === "google" && (
            <p className="mt-3 text-xs opacity-80">
              Automatically translated by Google Translate
            </p>
          )}
        </div>

        <div className="w-full flex flex-col items-center gap-6 max-w-md">
          <SearchDropdown
            label={whereAreYouLabel}
            placeholder={whereAreYouPlaceholder}
            apiUrl="/api/entrances"
            onSelect={(item) => setEntrance(item)}
          />

          <SearchDropdown
            label={appointmentLabel}
            placeholder={appointmentPlaceholder}
            apiUrl="/api/destinations-search"
            onSelect={(item) => setDestination(item)}
          />

          <div className="mb-6 flex items-center gap-3">
            <input
              id="accessible"
              type="checkbox"
              checked={accessible}
              onChange={(e) => setAccessible(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="accessible">{accessibleRouteText}</label>
          </div>

          <button
            onClick={handleStartNavigation}
            disabled={!entrance || !destination}
            className={`w-full mt-4 py-3 rounded-lg font-semibold transition ${
              entrance && destination
                ? "bg-white text-[#003087] hover:bg-gray-200"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            {startNavigationText}
          </button>
        </div>
      </div>

      <AccessibilityToolbar />
    </main>
  );
}