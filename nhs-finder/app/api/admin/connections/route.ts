import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fromId     = Number(body?.fromId);
    const toId       = Number(body?.toId);
    const buildingId = Number(body?.buildingId);
    const weight     = Number.isFinite(Number(body?.weight)) && Number(body?.weight) > 0
                         ? Math.round(Number(body.weight))
                         : 1;
    const accessible = body?.accessible === true || body?.accessible === 1 ? 1 : 0;

    if (!fromId || !toId || !buildingId) {
      return NextResponse.json(
        { error: "fromId, toId, and buildingId are required" },
        { status: 400 }
      );
    }
    if (fromId === toId) {
      return NextResponse.json(
        { error: "fromId and toId must be different nodes" },
        { status: 400 }
      );
    }

    const [fromDest, toDest] = await Promise.all([
      prisma.destination.findUnique({
        where:  { DestinationID: fromId },
        select: { DestinationID: true, DestinationName: true, MediaID: true },
      }),
      prisma.destination.findUnique({
        where:  { DestinationID: toId },
        select: { DestinationID: true, DestinationName: true, MediaID: true },
      }),
    ]);

    if (!fromDest) {
      return NextResponse.json({ error: `Start node not found: ID ${fromId}` }, { status: 404 });
    }
    if (!toDest) {
      return NextResponse.json({ error: `End node not found: ID ${toId}` }, { status: 404 });
    }

    const today   = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const result = await prisma.$transaction(async (tx) => {
      const status = await tx.status.upsert({
        where:  { StatusType: "Active" },
        update: {},
        create: { StatusType: "Active" },
      });

      const sequence = await tx.pSequence.create({
        data: {
          Prev: fromDest.MediaID,
          Next: toDest.MediaID,
        },
      });

      const createdPath = await tx.path.create({
        data: {
          PathName:     `${fromDest.DestinationName} -> ${toDest.DestinationName}`,
          AccessToggle: accessible,
          Date:         dateStr,
          Start:        fromId,
          End:          toId,
          PSequenceID:  sequence.PSequenceID,
          StatusID:     status.StatusID,
          BuildingID:   buildingId,
        },
      });

      const existingWeight = await tx.distanceWeight.findFirst({
        where: { From: fromId, To: toId },
      });

      const distanceWeight = existingWeight
        ? await tx.distanceWeight.update({
            where: { DistanceWeightID: existingWeight.DistanceWeightID },
            data:  { Weight: weight },
          })
        : await tx.distanceWeight.create({
            data: { From: fromId, To: toId, Weight: weight },
          });

      return { createdPath, sequence, distanceWeight };
    });

    return NextResponse.json({ ok: true, result }, { status: 201 });

  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    console.error("[admin/connections] POST failed:", msg, error);
    return NextResponse.json(
      { error: "Failed to save connection", details: msg },
      { status: 500 }
    );
  }
}
