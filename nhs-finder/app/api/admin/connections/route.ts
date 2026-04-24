import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

// ─── POST /api/admin/connections ─────────────────────────────────────────────
//
// Body (JSON):
//   fromId      number  — DestinationID of the start node
//   toId        number  — DestinationID of the end node
//   weight      number  — edge weight (positive integer, default 1)
//   accessible  boolean — sets AccessToggle on the Path row
//   buildingId  number  — BuildingID for the Path row
//
// Images are now stored per-node (Destination.MediaID → Media).
// PSequence.Prev = fromDest.MediaID, PSequence.Next = toDest.MediaID
// so the directions slideshow shows the from-node image then the to-node image.

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

    // Fetch both destinations including their MediaID
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

      // 1) Status
      const status = await tx.status.upsert({
        where:  { StatusType: "Active" },
        update: {},
        create: { StatusType: "Active" },
      });

      // 2) PSequence: Prev = from-node MediaID, Next = to-node MediaID
      //    No MediaID field on PSequence in the new schema.
      const sequence = await tx.pSequence.create({
        data: {
          Prev: fromDest.MediaID,
          Next: toDest.MediaID,
        },
      });

      // 3) Path
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

      // 4) DistanceWeight
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