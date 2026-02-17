"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useRouter } from "next/navigation";

const languages = [
  { code: "en", name: "English" },
  { code: "pl", name: "Polish" },
  { code: "fr", name: "French"},
  { code: "es", name: "Spanish"},
];

export default function LanguageSelector() {
  const router = useRouter();

  const changeLanguage = (locale: string) => {
    document.cookie = `locale=${locale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="border px-3 py-1 rounded">
          Language ▾
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
