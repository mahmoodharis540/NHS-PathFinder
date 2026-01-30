import MainDropdown from "@/components/BuildingLocationDropdown";
import LanguageSelector from "@/components/Languages";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home"); // use translations under "home"

  return (
    <main className="min-h-screen bg-[#003087] text-white flex flex-col items-center justify-center text-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <h1 className="text-3xl font-bold mb-2">{t("welcome")}</h1>
      <p className="text-sm italic mb-1">{t("subtitle")}</p>
      <p className="text-sm italic mb-6">{t("prompt")}</p>

      <MainDropdown />
    </main>
  );
}
