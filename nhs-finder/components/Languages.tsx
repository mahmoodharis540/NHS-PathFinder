"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LanguageSelector() {
  const router = useRouter();
  const t = useTranslations("languageSelector");

  const languages = [
    { code: "en", label: t("english") },
    { code: "ar-EG", label: t("egyptianArabic") },
    { code: "apc", label: t("levantineArabic") },
    { code: "ary", label: t("maghrebiArabic") },
    { code: "ar-AE", label: t("gulfArabic") },
    { code: "acm", label: t("mesopotamianArabic") },
    { code: "sk", label: t("slovak") },
    { code: "ti", label: t("tigrinya") },
    { code: "ckb", label: t("kurdishSorani") },
    { code: "ur", label: t("urdu") },
    { code: "fa", label: t("farsi") },
    { code: "ro", label: t("romanian") },
    { code: "pl", label: t("polish") },
    { code: "so", label: t("somali") },
    { code: "syl", label: t("bengaliSylheti") },
    { code: "tr", label: t("turkish") },
    { code: "vi", label: t("vietnamese") },
    { code: "sq", label: t("albanian") },
    { code: "am", label: t("amharic") },
    { code: "fr", label: t("french") },
    { code: "pa-Arab-PK", label: t("punjabiPakistani") },
    { code: "yue", label: t("cantonese") },
    { code: "kmr", label: t("kurdishBahdini") },
    { code: "om", label: t("oromo") },
  ];

  const changeLanguage = (locale: string) => {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="border px-3 py-1 rounded">
          {t("language")} ▾
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-h-80 overflow-y-auto">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}