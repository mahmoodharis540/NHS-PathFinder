import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Accessibility } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const buildingIdRaw = body?.buildingId;
    const isEntrance = Number(body?.isEntrance);
    const Accessibility = Number(body?.Accessibility);
    const mediaID = body?.mediaID;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!(isEntrance === 0 || isEntrance === 1)) {
      return NextResponse.json({ error: "isEntrance must be 0 or 1" }, { status: 400 });
    }

    const existing = await prisma.destination.findUnique({
      where: { DestinationName: name },
      select: {
        DestinationID: true,
        DestinationName: true,
        BuildingID: true,
        isEntrance: true,
        Accessibility: true,
        MediaID:true,
      },
    });

    if (existing) return NextResponse.json(existing);


    let buildingId: number | null =
      typeof buildingIdRaw === "number"
        ? buildingIdRaw
        : typeof buildingIdRaw === "string" && buildingIdRaw.trim()
        ? Number(buildingIdRaw)
        : null;

    if (!buildingId || !Number.isFinite(buildingId) || buildingId <= 0) {
      const firstBuilding = await prisma.building.findFirst({
        orderBy: { BuildingID: "asc" },
        select: { BuildingID: true },
      });

      if (!firstBuilding) {
        return NextResponse.json(
          { error: "No buildings exist yet. Create a building first." },
          { status: 400 }
        );
      }

      buildingId = firstBuilding.BuildingID;
    }

    const created = await prisma.destination.create({
      data: {
        DestinationName: name,
        BuildingID: buildingId,
        isEntrance: isEntrance,
        Accessibility: Accessibility,
        MediaID: mediaID,
        
      },
      select: {
        DestinationID: true,
        DestinationName: true,
        BuildingID: true,
        isEntrance: true,
        Accessibility: true,
        MediaID: true,
      },
    });

    return NextResponse.json(created);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to create destination", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
