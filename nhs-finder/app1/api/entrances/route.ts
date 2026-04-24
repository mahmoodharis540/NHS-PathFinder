import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const take = Number(searchParams.get("take") ?? 35) || 35;
    const buildingIdRaw = searchParams.get("buildingId");
    const buildingId = buildingIdRaw ? Number(buildingIdRaw) : null;

    const entrances = await prisma.destination.findMany({
      where: {
        isEntrance: 1,
        ...(buildingId && Number.isFinite(buildingId) ? { BuildingID: buildingId } : {}),
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch entrances", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
