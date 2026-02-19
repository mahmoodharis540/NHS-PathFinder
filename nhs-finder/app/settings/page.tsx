"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";

type Language = "en" | "ur" | "pl" | "ar";
type BuildingId = "northern-general" | "royal-hallamshire" | "weston-park";

type AppSettings = {
  language: Language;
  defaultBuilding: BuildingId;
  highContrast: boolean;
  largeText: number;
  reducedMotion: boolean;
};

const STORAGE_KEY = "nhs_pathfinder_settings_v1";

const NHS_BLUE = "#003087";

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  defaultBuilding: "northern-general",
  highContrast: false,
  largeText: 16,
  reducedMotion: false,
};

export default function SettingsPage() {
  const router = useRouter();

  const buildingOptions = useMemo(
    () => [
      { id: "northern-general" as const, name: "Northern General Hospital" },
      { id: "royal-hallamshire" as const, name: "Royal Hallamshire Hospital" },
      { id: "weston-park" as const, name: "Weston Park Hospital" },
    ],
    []
  );

  const languageOptions = useMemo(
    () => [
      { id: "en" as const, name: "English" },
      { id: "ur" as const, name: "Urdu" },
      { id: "pl" as const, name: "Polski (Polish)" },
      { id: "ar" as const, name: "العربية (Arabic)" },
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
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event("nhs-settings-updated"));
    } catch { }
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
            aria-label="Back to main page"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-white/80 text-sm">Accessibility & preferences</p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-8 max-w-3xl mx-auto space-y-6">
        {/* Language */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Language</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose the language used across the app.
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">App language</label>
            <select
              value={settings.language}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  language: e.target.value as Language,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
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
              Save language
            </button>
          </div>
        </section>

        {/* Default building */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Default building</h2>
          <p className="text-sm text-gray-600 mt-1">
            The app can pre-select this building to speed things up.
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Choose building</label>
            <select
              value={settings.defaultBuilding}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  defaultBuilding: e.target.value as BuildingId,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
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
              Save default building
            </button>
          </div>
        </section>

        {/* Accessibility */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Accessibility</h2>
          <p className="text-sm text-gray-600 mt-1">
            Options to improve readability and reduce strain.
          </p>

          <div className="mt-5 space-y-4">
            <ToggleRow
              title="High contrast mode"
              description="Stronger colours and clearer text for visual impairment."
              checked={settings.highContrast}
              onChange={(v) => setSettings((p) => ({ ...p, highContrast: v }))}
            />
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <p className="font-medium">Font size</p>
                <span className="text-sm text-gray-600">{settings.largeText}px</span>
              </div>
              <p className="text-sm text-gray-600">Adjust the overall Font size.</p>
              <input
                type="range"
                min={12}
                max={24}
                step={2}
                value={settings.largeText}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, largeText: Number(e.target.value) }))
                }
                style={{
                  background: `linear-gradient(to right, #003087 0%, #003087 ${((settings.largeText - 12) / (24 - 12)) * 100   // was settings.textSize
                    }%, #d1d5db ${((settings.largeText - 12) / (24 - 12)) * 100
                    }%, #d1d5db 100%)`,
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer mt-2
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#003087]
                  [&::-webkit-slider-thumb]:cursor-pointer"
                aria-label="Text size"

              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Smallest</span>
                <span>Default</span>
                <span>Largest</span>
              </div>
            </div>

            <ToggleRow
              title="Reduce motion"
              description="Minimise animations to reduce dizziness or discomfort."
              checked={settings.reducedMotion}
              onChange={(v) => setSettings((p) => ({ ...p, reducedMotion: v }))}
            />

            <button
              type="button"
              onClick={() => {
                setSettings(DEFAULT_SETTINGS);
                showSaved();
              }}
              className="mt-2 w-full md:w-auto inline-flex justify-center bg-gray-100 border border-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Reset to defaults
            </button>

            <Link
              href="/"
              className="mt-4 block w-full md:w-auto text-center text-white px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: NHS_BLUE }}
            >
              Done
            </Link>
          </div>
        </section>

        {savedToast && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-lg">
            Saved
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