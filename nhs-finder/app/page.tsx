"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import Languages from "@/components/Languages";
import SearchDropdown from "@/components/SearchDropdown";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");
  const router = useRouter();

  const [entrance, setEntrance] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);

  const handleStartNavigation = () => {
    if (!entrance || !destination) return;

    router.push(
      `/directions?entrance=${encodeURIComponent(
        entrance.name
      )}&destination=${encodeURIComponent(destination.name)}`
    );
  };

  return (
    <main className="min-h-screen bg-[#003087] text-white relative">
      <TopBar />

      <div className="absolute bottom-4 left-4">
        <Languages />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">{t("welcome")}</h1>
          <p className="text-sm italic mb-4">{t("subtitle")}</p>
          <p>{t("prompt")}</p>
        </div>

        <div className="w-full flex flex-col items-center gap-6 max-w-md">
          <SearchDropdown
            label="Where are you:"
            placeholder="Search the entrance you are at..."
            apiUrl="/api/entrances"
            onSelect={(item) => setEntrance(item)}
          />

          <SearchDropdown
            label="What building is your appointment:"
            placeholder="Search for the building/department..."
            apiUrl="/api/destinations-search"
            onSelect={(item) => setDestination(item)}
          />

          {/* Start Navigation Button */}
          <button
            onClick={handleStartNavigation}
            disabled={!entrance || !destination}
            className={`w-full mt-4 py-3 rounded-lg font-semibold transition ${
              entrance && destination
                ? "bg-white text-[#003087] hover:bg-gray-200"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            Start Navigation
          </button>
        </div>
      </div>

      <AccessibilityToolbar />
    </main>
  );
}
