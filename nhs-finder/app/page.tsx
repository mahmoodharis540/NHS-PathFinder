import MainDropdown from "@/components/BuildingLocationDropdown";
import Languages from "@/components/Languages";
import TopBar from "@/components/TopBar";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#003087] text-white relative">
      <TopBar />

      <div className="absolute bottom-4 left-4">
        <Languages />
      </div>

      <div className="flex flex-col items-center justify-center text-center min-h-screen px-4">
        <h1 className="text-3xl font-bold mb-2">Welcome to NHS Finder</h1>
        <p className="text-sm italic mb-6">Your gateway to healthcare services.</p>
        <p className="mb-6">What building do you want to go to?</p>

        <MainDropdown />
      </div>

      <AccessibilityToolbar />
    </main>
  );
}
