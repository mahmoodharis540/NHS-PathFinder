"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import Languages from "@/components/Languages";
import SearchDropdown from "@/components/SearchDropdown";
import { useTranslations } from "next-intl";
import useGoogleTranslatedText from "@/components/useGoogleTranslatedText";
import { useTranslationMode } from "@/components/TranslationProvider";

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
  const [destinationText, setDestinationText] = useState("");
  const [qrMessage, setQrMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLocationsFromQr() {
      const entranceId = (searchParams.get("entranceId") ?? "").trim();
      const entranceName = (searchParams.get("entrance") ?? "").trim();
      const destinationId = (searchParams.get("destinationId") ?? "").trim();
      const destinationName = (searchParams.get("destination") ?? "").trim();

      if (!entranceId && !entranceName && !destinationId && !destinationName) {
        return;
      }

      setQrMessage(t("qrLoading"));

      try {
        let resolvedEntrance: LocationItem | null = null;
        let resolvedDestination: LocationItem | null = null;

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

        if (destinationId) {
          const res = await fetch(`/api/destinations/${encodeURIComponent(destinationId)}`, {
            cache: "no-store",
          });
          const text = await res.text();
          if (!res.ok) throw new Error(text);
          resolvedDestination = JSON.parse(text) as LocationItem;
        } else if (destinationName) {
          const res = await fetch(
            `/api/destinations-search?take=35&q=${encodeURIComponent(destinationName)}`,
            { cache: "no-store" }
          );
          const text = await res.text();
          if (!res.ok) throw new Error(text);
          const matches = JSON.parse(text) as LocationItem[];
          resolvedDestination =
            matches.find(
              (item) => item.DestinationName.toLowerCase() === destinationName.toLowerCase()
            ) ?? null;
          if (!resolvedDestination) throw new Error("Destination not found");
        }

        if (!cancelled) {
          if (resolvedEntrance) {
            setEntrance(resolvedEntrance);
            setEntranceText(resolvedEntrance.DestinationName);
          }

          if (resolvedDestination) {
            setDestination(resolvedDestination);
            setDestinationText(resolvedDestination.DestinationName);
          }

          if (resolvedEntrance && resolvedDestination) {
            setQrMessage(
              t("qrSuccessFull", {
                entrance: resolvedEntrance.DestinationName,
                destination: resolvedDestination.DestinationName,
              })
            );
          } else if (resolvedEntrance) {
            setQrMessage(t("qrSuccess", { entrance: resolvedEntrance.DestinationName }));
          } else if (resolvedDestination) {
            setQrMessage(t("qrDestinationSuccess", { destination: resolvedDestination.DestinationName }));
          }
        }
      } catch {
        if (!cancelled) {
          setQrMessage(t("qrInvalid"));
        }
      }
    }

    loadLocationsFromQr();

    return () => {
      cancelled = true;
    };
  }, [searchParams, t]);

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
          {qrMessage && (
            <div className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
              {qrMessage}
            </div>
          )}

          <SearchDropdown
            label={whereAreYouLabel}
            placeholder={whereAreYouPlaceholder}
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
            label={appointmentLabel}
            placeholder={appointmentPlaceholder}
            apiUrl="/api/destinations-search"
            onSelect={(item) => {
              setDestination(item);
              setDestinationText(item.DestinationName);
              setQrMessage("");
            }}
            value={destinationText}
            onChangeText={(text) => {
              setDestinationText(text);
              setDestination(null);
              setQrMessage("");
            }}
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
    </main>
  );
}
