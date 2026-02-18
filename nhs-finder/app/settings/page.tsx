"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";
import { useTranslations } from "next-intl";

type Language = "en" | "ur" | "pl" | "ar";
type BuildingId = "northern-general" | "royal-hallamshire" | "weston-park";

type AppSettings = {
  language: Language;
  defaultBuilding: BuildingId;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
};

const STORAGE_KEY = "nhs_pathfinder_settings_v1";
const NHS_BLUE = "#003087";

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  defaultBuilding: "northern-general",
  highContrast: false,
  largeText: false,
  reducedMotion: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations("settings");

  const buildingOptions = useMemo(
    () => [
      { id: "northern-general" as const, name: t("northernGeneral") },
      { id: "royal-hallamshire" as const, name: t("royalHallamshire") },
      { id: "weston-park" as const, name: t("westonPark") },
    ],
    [t]
  );

  const languageOptions = useMemo(
    () => [
      { id: "en" as const, name: "English" },
      { id: "ur" as const, name: "Urdu" },
      { id: "pl" as const, name: "Polski" },
      { id: "ar" as const, name: "العربية" },
    ],
    []
  );

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event("nhs-settings-updated"));
    } catch {}
  }, [settings]);

  function showSaved() {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1200);
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <div
        className="text-white px-6 md:px-8 py-6 flex items-center justify-between"
        style={{ backgroundColor: NHS_BLUE }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-white/10 transition"
            aria-label={t("back")}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div>
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p className="text-white/80 text-sm">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-8 max-w-3xl mx-auto space-y-6">
        {/* Language */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">{t("languageTitle")}</h2>
          <p className="text-sm text-gray-600 mt-1">{t("languageDesc")}</p>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              {t("appLanguage")}
            </label>
            <select
              value={settings.language}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  language: e.target.value as Language,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              {languageOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={showSaved}
              className="mt-4 inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: NHS_BLUE }}
            >
              <Check className="h-4 w-4" />
              {t("saveLanguage")}
            </button>
          </div>
        </section>

        {/* Default building */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">{t("defaultBuildingTitle")}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("defaultBuildingDesc")}
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              {t("chooseBuilding")}
            </label>
            <select
              value={settings.defaultBuilding}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  defaultBuilding: e.target.value as BuildingId,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              {buildingOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={showSaved}
              className="mt-4 inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: NHS_BLUE }}
            >
              <Check className="h-4 w-4" />
              {t("saveDefaultBuilding")}
            </button>
          </div>
        </section>

        {/* Accessibility */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">{t("accessibilityTitle")}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("accessibilityDesc")}
          </p>

          <div className="mt-5 space-y-4">
            <ToggleRow
              title={t("highContrast")}
              description={t("highContrastDesc")}
              checked={settings.highContrast}
              onChange={(v) => setSettings((p) => ({ ...p, highContrast: v }))}
            />

            <ToggleRow
              title={t("largeText")}
              description={t("largeTextDesc")}
              checked={settings.largeText}
              onChange={(v) => setSettings((p) => ({ ...p, largeText: v }))}
            />

            <ToggleRow
              title={t("reduceMotion")}
              description={t("reduceMotionDesc")}
              checked={settings.reducedMotion}
              onChange={(v) => setSettings((p) => ({ ...p, reducedMotion: v }))}
            />

            <button
              type="button"
              onClick={() => {
                setSettings(DEFAULT_SETTINGS);
                showSaved();
              }}
              className="mt-2 w-full md:w-auto bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              {t("resetDefaults")}
            </button>

            <Link
              href="/"
              className="mt-4 block w-full md:w-auto text-center text-white px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: NHS_BLUE }}
            >
              {t("done")}
            </Link>
          </div>
        </section>

        {savedToast && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-lg">
            {t("saved")}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-7 w-12 items-center rounded-full transition"
        style={{ backgroundColor: checked ? "#003087" : "#d1d5db" }}
        aria-pressed={checked}
        aria-label={title}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white transition",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
