import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const take = Number(searchParams.get("take") ?? 35) || 35;

    const entrances = await prisma.destination.findMany({
      where: {
        isEntrance: 1,
        ...(q
          ? { DestinationName: { contains: q } }
          : {}),
      },
      orderBy: { DestinationName: "asc" },
      take,
      select: {
        DestinationID: true,
        DestinationName: true,
        BuildingID: true,
        isEntrance: true,
      },
    });

    return NextResponse.json(entrances);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch entrances", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
