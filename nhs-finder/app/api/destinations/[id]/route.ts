import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const destinationId = Number(id);

  if (!Number.isFinite(destinationId)) {
    return NextResponse.json({ error: "Invalid destination id" }, { status: 400 });
  }

  const destination = await prisma.destination.findFirst({
    where: { DestinationID: destinationId },
    select: {
      DestinationID: true,
      DestinationName: true,
      BuildingID: true,
      isEntrance: true,
    },
  });

  if (!destination) {
    return NextResponse.json({ error: "Destination not found" }, { status: 404 });
  }

  return NextResponse.json(destination);
}
