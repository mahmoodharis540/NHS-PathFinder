"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import Languages from "@/components/Languages";
import SearchDropdown from "@/components/SearchDropdown";
import { useTranslations } from "next-intl";

type LocationItem = {
  DestinationID: number;
  DestinationName: string;
  BuildingID: number;
  isEntrance: number;
};

export default function HomePage() {
  const t = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessible, setAccessible] = useState(false);

  const [entrance, setEntrance] = useState<LocationItem | null>(null);
  const [destination, setDestination] = useState<LocationItem | null>(null);
  const [entranceText, setEntranceText] = useState("");
  const [qrMessage, setQrMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEntranceFromQr() {
      const entranceId = (searchParams.get("entranceId") ?? "").trim();
      const entranceName = (searchParams.get("entrance") ?? "").trim();

      if (!entranceId && !entranceName) {
        return;
      }

      setQrMessage(t("qrLoading"));

      try {
        let resolvedEntrance: LocationItem | null = null;

        if (entranceId) {
          const res = await fetch(`/api/entrances/${encodeURIComponent(entranceId)}`, {
            cache: "no-store",
          });
          const text = await res.text();
          if (!res.ok) throw new Error(text);
          resolvedEntrance = JSON.parse(text) as LocationItem;
        } else if (entranceName) {
          const res = await fetch(
            `/api/entrances?take=35&q=${encodeURIComponent(entranceName)}`,
            { cache: "no-store" }
          );
          const text = await res.text();
          if (!res.ok) throw new Error(text);
          const matches = JSON.parse(text) as LocationItem[];
          resolvedEntrance =
            matches.find(
              (item) => item.DestinationName.toLowerCase() === entranceName.toLowerCase()
            ) ?? null;
          if (!resolvedEntrance) throw new Error("Entrance not found");
        }

        if (!resolvedEntrance) return;

        if (!cancelled) {
          setEntrance(resolvedEntrance);
          setEntranceText(resolvedEntrance.DestinationName);
          setQrMessage(t("qrSuccess", { entrance: resolvedEntrance.DestinationName }));
        }
      } catch {
        if (!cancelled) {
          setQrMessage(t("qrInvalid"));
        }
      }
    }

    loadEntranceFromQr();

    return () => {
      cancelled = true;
    };
  }, [searchParams, t]);

  const handleStartNavigation = () => {
    if (!entrance || !destination) return;

    router.push(
      `/directions?entrance=${encodeURIComponent(
        entrance.DestinationName   // ← was entrance.name
      )}&destination=${encodeURIComponent(
        destination.DestinationName // ← was destination.name
      )}`
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

          <h1 className="text-2xl font-bold mt-6">{t("pathfinder")}</h1>

          <p className="text-sm italic mt-2 mb-4">{t("subtitle")}</p>
          <p>{t("prompt")}</p>
        </div>

        <div className="w-full flex flex-col items-center gap-6 max-w-md">
          {qrMessage && (
            <div className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
              {qrMessage}
            </div>
          )}

          <SearchDropdown
            label={t("whereAreYouLabel")}
            placeholder={t("whereAreYouPlaceholder")}
            apiUrl="/api/entrances"
            onSelect={(item) => {
              setEntrance(item);
              setEntranceText(item.DestinationName);
              setQrMessage("");
            }}
            value={entranceText}
            onChangeText={(text) => {
              setEntranceText(text);
              setEntrance(null);
              setQrMessage("");
            }}
          />

          <SearchDropdown
            label={t("appointmentBuildingLabel")}
            placeholder={t("appointmentBuildingPlaceholder")}
            apiUrl="/api/destinations-search"
            onSelect={(item) => setDestination(item)}
          />

          {/* Accessible toggle */}
          <div className="mb-6 flex items-center gap-3">
            <input
              id="accessible"
              type="checkbox"
              checked={accessible}
              onChange={(e) => setAccessible(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="accessible" className="text-sm">
              {t("accessibleRoute")}
            </label>
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
            {t("startNavigation")}
          </button>
        </div>
      </div>

      <AccessibilityToolbar />
    </main>
  );
}
