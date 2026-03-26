"use client";

import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useTranslationMode } from "@/components/TranslationProvider";

type ExtraLanguage = {
  code: string;
  label: string;
};

const SUPPORTED_LOCALES = new Set([
  "am",
  "ar-EG",
  "ar-LB",
  "ar-MA",
  "ar-AE",
  "ar-IQ",
  "bn",
  "ckb",
  "en",
  "es",
  "fa",
  "fr",
  "kmr",
  "ku-Arab-IQ",
  "om",
  "pa-Arab-PK",
  "pl",
  "ro",
  "sk",
  "so",
  "sq",
  "ti",
  "tr",
  "ur",
  "vi",
  "yue",
]);

const EXTRA_GOOGLE_LANGUAGES: ExtraLanguage[] = [
  { code: "de", label: "German" },
  { code: "gu", label: "Gujarati" },
  { code: "hi", label: "Hindi" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ml", label: "Malayalam" },
  { code: "mr", label: "Marathi" },
  { code: "ne", label: "Nepali" },
  { code: "nl", label: "Dutch" },
  { code: "or", label: "Odia" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "sv", label: "Swedish" },
  { code: "sw", label: "Swahili" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "th", label: "Thai" },
  { code: "uk", label: "Ukrainian" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
];

export default function LanguageSelector() {
  const t = useTranslations("languageSelector");
  const { setGoogleMode, setNormalMode } = useTranslationMode();

  const [showOtherLanguages, setShowOtherLanguages] = useState(false);
  const [search, setSearch] = useState("");

  const appLanguages = [
    { code: "en", label: t("english") },
    { code: "ar-EG", label: t("egyptianArabic") },
    { code: "ar-LB", label: t("levantineArabic") },
    { code: "ar-MA", label: t("maghrebiArabic") },
    { code: "ar-AE", label: t("gulfArabic") },
    { code: "ar-IQ", label: t("mesopotamianArabic") },
    { code: "sk", label: t("slovak") },
    { code: "ti", label: t("tigrinya") },
    { code: "ckb", label: t("kurdishSorani") },
    { code: "ur", label: t("urdu") },
    { code: "fa", label: t("farsi") },
    { code: "ro", label: t("romanian") },
    { code: "pl", label: t("polish") },
    { code: "so", label: t("somali") },
    { code: "bn", label: t("bengaliSylheti") },
    { code: "tr", label: t("turkish") },
    { code: "vi", label: t("vietnamese") },
    { code: "sq", label: t("albanian") },
    { code: "am", label: t("amharic") },
    { code: "fr", label: t("french") },
    { code: "pa-Arab-PK", label: t("punjabiPakistani") },
    { code: "yue", label: t("cantonese") },
    { code: "kmr", label: t("kurdishBahdini") },
    { code: "om", label: t("oromo") },
    { code: "es", label: t("spanish") },
  ];

  const filteredExtraLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return EXTRA_GOOGLE_LANGUAGES;

    return EXTRA_GOOGLE_LANGUAGES.filter(
      (lang) =>
        lang.label.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [search]);

  const changeLanguage = (locale: string) => {
    if (SUPPORTED_LOCALES.has(locale)) {
      setNormalMode();
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
      window.location.reload();
      return;
    }

    setGoogleMode(locale);
    window.location.reload();
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="border px-3 py-1 rounded">
            {t("language")} ▾
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="max-h-80 overflow-y-auto">
          {appLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
            >
              {lang.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuItem onClick={() => setShowOtherLanguages((prev) => !prev)}>
            Other languages (Google Translate)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showOtherLanguages && (
        <div className="mt-3 w-[320px] max-w-[90vw] rounded-2xl bg-white p-4 text-black shadow-lg">
          <p className="mb-3 font-semibold">Other languages</p>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a language..."
            className="mb-3 w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200">
            {filteredExtraLanguages.length > 0 ? (
              filteredExtraLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setGoogleMode(lang.code);
                    setShowOtherLanguages(false);
                    setSearch("");
                    window.location.reload();
                  }}
                  className="block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 last:border-b-0"
                >
                  {lang.label}
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-gray-500">
                No languages found.
              </p>
            )}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Built-in app languages stay unchanged. This search is only for extra
            languages using Google Translate.
          </p>
        </div>
      )}
    </div>
  );
}