import MainDropdown from "@/components/MainDropdown";
import TopBar from "@/components/TopBar";

export default function HomePage() {
  return (
  
      <main className="min-h-screen  bg-[#003087] flex flex-col items-center justify-center text-center px-4">
          <TopBar />
        <h1 className="text-2xl font-bold mb-2">
          Welcome to NHS PathFinder
        </h1>
      <p className="text-sm italic">"Find your way around NHS buildings the modern way."</p>
      <p className="mt-6 ">What building do you want to go to?</p>

      <div className="mt-6 flex justify-center">
        <MainDropdown />
      </div>
      
    </main>
  );
}
