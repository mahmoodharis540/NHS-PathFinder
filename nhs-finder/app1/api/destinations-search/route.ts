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
    const isEntranceParam = searchParams.get("isEntrance");
    const isEntrance =
      isEntranceParam === "0" || isEntranceParam === "1" ? Number(isEntranceParam) : null;

    const results = await prisma.destination.findMany({
      where: {
        ...(buildingId && Number.isFinite(buildingId) ? { BuildingID: buildingId } : {}),
        ...(isEntrance === 0 || isEntrance === 1 ? { isEntrance } : {}),
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

    return NextResponse.json(results);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to search destinations", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
