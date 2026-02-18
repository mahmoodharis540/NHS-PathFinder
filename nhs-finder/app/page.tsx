// "use client";

// import MainDropdown from "@/components/BuildingLocationDropdown";
// import TopBar from "@/components/TopBar";
// import AccessibilityToolbar from "@/components/AccessibilityToolbar";
// import Languages from "@/components/Languages";
// import { useTranslations } from "next-intl";

// export default function HomePage() {
//   const t = useTranslations("home");
//   return (
//     <main className="min-h-screen bg-[#003087] text-white relative">
//       <TopBar />
//       <div className="absolute bottom-4 left-4">
//         <Languages />
//       </div>
//       <div className="flex flex-col items-center justify-center text-center min-h-screen px-4">
//         <h1 className="text-3xl font-bold mb-2">{t("welcome")}</h1>
//         <p className="text-sm italic mb-6">{t("subtitle")}</p>
//         <p className="mb-6">{t("prompt")}</p>
//         <MainDropdown/>
//         <MainDropdown/>
//       </div>
//       <AccessibilityToolbar />
//     </main>
//   );
// }


"use client";

import TopBar from "@/components/TopBar";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import Languages from "@/components/Languages";
import SearchDropdown from "@/components/SearchDropdown";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen bg-[#003087] text-white relative">
      <TopBar />

      <div className="absolute bottom-4 left-4">
        <Languages />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">{t("welcome")}</h1>
          <p className="text-sm italic mb-4">{t("subtitle")}</p>
          <p>{t("prompt")}</p>
        </div>

        <div className="w-full flex flex-col items-center gap-6">
          <SearchDropdown
            label="Where are you :"
            placeholder="Search the entrance you are at..."
            apiUrl="/api/entrances"
            onSelect={(item) => console.log("User entrance:", item)}
          />

          <SearchDropdown
            label="What building is your appointment:"
            placeholder="Search for the building/department..."
            apiUrl="/api/destinations-search"
            onSelect={(item) => console.log("Appointment destination:", item)}
          />
        </div>
      </div>

      <AccessibilityToolbar />
    </main>
  );
}
