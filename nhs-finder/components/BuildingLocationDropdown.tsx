"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

export default function MainDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-1 border px-4 py-2 rounded">
          Select Building
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href="/db/Video/JessopWing">Jessops Wing</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/db/Video/Radiology">Radiology</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/db/Video/AIBuilding">AI Building</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
