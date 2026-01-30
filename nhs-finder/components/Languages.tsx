"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Define the languages we want in the dropdown
const languages = [
  { code: "en", name: "English" },
  { code: "pl", name: "Polish" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "ar", name: "Arabic" },
  { code: "fr", name: "French" },
  { code: "zh", name: "Chinese" },
  { code: "es", name: "Spanish" },
];

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();

  // Get the current locale from the path
  const currentLocaleMatch = pathname.match(/^\/([a-z]{2})/);
  const currentLocale = currentLocaleMatch ? currentLocaleMatch[1].toUpperCase() : "EN";

  const changeLanguage = (locale: string) => {
    // Replace existing locale in the path or add it
    router.push(`/${locale}${pathname.replace(/^\/([a-z]{2})/, "")}`);
  };

  const openGoogleTranslate = () => {
    alert("Google Translate widget would open here!");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 border px-3 py-1 rounded bg-white text-black">
          Language: {currentLocale} ▾
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={openGoogleTranslate}>
          More languages via Google Translate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
