"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

export default function TopBar() {
  return (
    <header className="absolute top-0 left-0 w-full p-4 flex items-center justify-between">
      {/* Left side */}
      <Link
        href="/loginAdmin"
        className="text-white border border-white px-4 py-1 rounded hover:bg-white hover:text-[#003087] transition"
      >
        Login
      </Link>

      {/* Right side */}
      <Link href="/settings" className="text-white hover:opacity-80">
        <Settings className="h-6 w-6" />
      </Link>
    </header>
  );
}
