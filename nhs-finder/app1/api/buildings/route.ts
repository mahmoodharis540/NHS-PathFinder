
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const buildings = await prisma.building.findMany();
  return NextResponse.json(buildings);
}
