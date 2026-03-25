import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const entranceId = Number(id);

    if (!Number.isFinite(entranceId) || entranceId <= 0) {
      return NextResponse.json({ error: "Invalid entrance id" }, { status: 400 });
    }

    const entrance = await prisma.destination.findFirst({
      where: {
        DestinationID: entranceId,
        isEntrance: 1,
      },
      select: {
        DestinationID: true,
        DestinationName: true,
        BuildingID: true,
        isEntrance: true,
      },
    });

    if (!entrance) {
      return NextResponse.json({ error: "Entrance not found" }, { status: 404 });
    }

    return NextResponse.json(entrance);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch entrance", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
