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
    { code: "pl", label: t("polish") },
    { code: "fr", label: t("french") },
    { code: "es", label: t("spanish") },
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

      <DropdownMenuContent>
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
