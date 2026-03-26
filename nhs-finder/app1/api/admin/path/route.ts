import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isEntranceName(name: string): number {
  return /entrance/i.test(name) ? 1 : 0;
}

async function getOrCreatePlaceholderMedia(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<number> {
  const existing = await tx.media.findFirst({
    where:  { Media: "/placeholder" },
    select: { MediaID: true },
  });
  if (existing) return existing.MediaID;
  const created = await tx.media.create({
    data: { Media: "/placeholder", MediaDesc: "No image" },
    select: { MediaID: true },
  });
  return created.MediaID;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const buildingId   = Number(form.get("buildingId"));
    const pathName     = String(form.get("pathName")   ?? "").trim();
    const startName    = String(form.get("startName")  ?? "").trim();
    const endName      = String(form.get("endName")    ?? "").trim();
    const statusType   = String(form.get("statusType") ?? "Active").trim() || "Active";
    const accessToggle = form.get("accessToggle") === "1" ? 1 : 0;

    const weightRaw = Number(form.get("weight") ?? 1);
    const weight    = Number.isFinite(weightRaw) && weightRaw > 0 ? Math.round(weightRaw) : 1;

    const accessibilityRaw = Number(form.get("accessibility") ?? 0);
    const accessibility    = accessibilityRaw === 1 ? 1 : 0;

    const today       = new Date();
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const date        = String(form.get("date") ?? defaultDate).trim() || defaultDate;

    if (!buildingId || !pathName || !startName || !endName) {
      return NextResponse.json(
        { error: "Missing required fields: buildingId, pathName, startName, endName" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {

      const status = await tx.status.upsert({
        where:  { StatusType: statusType },
        update: {},
        create: { StatusType: statusType },
      });

      // Start destination — MediaID required, use placeholder for new nodes
      let startDest = await tx.destination.findUnique({ where: { DestinationName: startName } });
      if (!startDest) {
        const pid = await getOrCreatePlaceholderMedia(tx);
        startDest = await tx.destination.create({
          data: {
            DestinationName: startName,
            BuildingID:      buildingId,
            isEntrance:      isEntranceName(startName),
            Accessibility:   accessibility,
            MediaID:         pid,
          },
        });
      }

      // End destination
      let endDest = await tx.destination.findUnique({ where: { DestinationName: endName } });
      if (!endDest) {
        const pid = await getOrCreatePlaceholderMedia(tx);
        endDest = await tx.destination.create({
          data: {
            DestinationName: endName,
            BuildingID:      buildingId,
            isEntrance:      isEntranceName(endName),
            Accessibility:   accessibility,
            MediaID:         pid,
          },
        });
      }

      // PSequence: Prev = start MediaID, Next = end MediaID (no MediaID field on PSequence)
      const sequence = await tx.pSequence.create({
        data: {
          Prev: startDest.MediaID,
          Next: endDest.MediaID,
        },
      });

      const createdPath = await tx.path.create({
        data: {
          PathName:     pathName,
          AccessToggle: accessToggle,
          Date:         date,
          Start:        startDest.DestinationID,
          End:          endDest.DestinationID,
          PSequenceID:  sequence.PSequenceID,
          StatusID:     status.StatusID,
          BuildingID:   buildingId,
        },
      });

      const existingWeight = await tx.distanceWeight.findFirst({
        where: { From: startDest.DestinationID, To: endDest.DestinationID },
      });

      const distanceWeight = existingWeight
        ? await tx.distanceWeight.update({
            where: { DistanceWeightID: existingWeight.DistanceWeightID },
            data:  { Weight: weight },
          })
        : await tx.distanceWeight.create({
            data: { From: startDest.DestinationID, To: endDest.DestinationID, Weight: weight },
          });

      return { createdPath, startDest, endDest, status, sequence, distanceWeight };
    });

    return NextResponse.json({ ok: true, result }, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/path] POST failed:", msg, err);
    return NextResponse.json(
      { error: "Failed to create path", details: msg },
      { status: 500 }
    );
  }
}