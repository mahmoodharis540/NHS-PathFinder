import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isEntranceName(name: string): number {
  return /entrance/i.test(name) ? 1 : 0;
}

function safeFileName(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // ── Parse form fields ──────────────────────────────────────────────────
    const buildingId    = Number(form.get("buildingId"));
    const pathName      = String(form.get("pathName")      ?? "").trim();
    const startName     = String(form.get("startName")     ?? "").trim();
    const endName       = String(form.get("endName")       ?? "").trim();
    const description   = String(form.get("description")   ?? "").trim();
    const statusType    = String(form.get("statusType")    ?? "Active").trim() || "Active";
    const accessToggle  = form.get("accessToggle") === "1" ? 1 : 0;

    // Weight for the DistanceWeight edge (Start → End).
    // Accepts a positive integer; defaults to 1 if omitted or invalid.
    const weightRaw = Number(form.get("weight") ?? 1);
    const weight    = Number.isFinite(weightRaw) && weightRaw > 0
                        ? Math.round(weightRaw)
                        : 1;

    // Accessibility flag for newly-created destinations (0 = standard, 1 = accessible).
    // When a destination already exists we leave its Accessibility unchanged.
    const accessibilityRaw = Number(form.get("accessibility") ?? 0);
    const accessibility    = accessibilityRaw === 1 ? 1 : 0;

    // Date (stored as String in schema)
    const today       = new Date();
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const date        = String(form.get("date") ?? defaultDate).trim() || defaultDate;

    // ── Basic validation ───────────────────────────────────────────────────
    if (!buildingId || !pathName || !startName || !endName) {
      return NextResponse.json(
        { error: "Missing required fields: buildingId, pathName, startName, endName" },
        { status: 400 }
      );
    }

    const files = form.getAll("files").filter((f) => f instanceof File) as File[];
    if (files.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least 1 media file (image/video) for the path." },
        { status: 400 }
      );
    }

    // ── Ensure uploads directory exists ───────────────────────────────────
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // ── Main transaction ───────────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {

      // 1) Status — upsert so "Active" / "Draft" always exist
      const status = await tx.status.upsert({
        where:  { StatusType: statusType },
        update: {},
        create: { StatusType: statusType },
      });

      // 2) Start destination
      //    Destination.Accessibility is a required Int — must be supplied on create.
      //    If the row already exists we leave it as-is (findUnique returns it).
      const startDest =
        (await tx.destination.findUnique({ where: { DestinationName: startName } })) ??
        (await tx.destination.create({
          data: {
            DestinationName: startName,
            BuildingID:      buildingId,
            isEntrance:      isEntranceName(startName),
            Accessibility:   accessibility,
          },
        }));

      // 3) End destination
      const endDest =
        (await tx.destination.findUnique({ where: { DestinationName: endName } })) ??
        (await tx.destination.create({
          data: {
            DestinationName: endName,
            BuildingID:      buildingId,
            isEntrance:      isEntranceName(endName),
            Accessibility:   accessibility,
          },
        }));

      // 4) Save files to disk and create Media rows
      const createdMedia = [];
      for (const file of files) {
        const buffer   = Buffer.from(await file.arrayBuffer());
        const stamp    = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const filename = `${stamp}-${safeFileName(file.name)}`;

        await writeFile(path.join(uploadsDir, filename), buffer);

        const media = await tx.media.create({
          data: {
            Media:     `/uploads/${filename}`,
            MediaDesc: description || `Media for: ${pathName}`,
          },
        });
        createdMedia.push(media);
      }

      // 5) Build PSequence linked list
      //    Each row: MediaID = this slide, Prev = previous MediaID (self if first),
      //                                    Next = next MediaID (self if last).
      const sequences = [];
      for (let i = 0; i < createdMedia.length; i++) {
        const prevMediaId = createdMedia[i - 1]?.MediaID ?? createdMedia[i].MediaID;
        const nextMediaId = createdMedia[i + 1]?.MediaID ?? createdMedia[i].MediaID;

        const seq = await tx.pSequence.create({
          data: {
            MediaID: createdMedia[i].MediaID,
            Prev:    prevMediaId,
            Next:    nextMediaId,
          },
        });
        sequences.push(seq);
      }

      // 6) Create Path — PSequenceID points to the first node in the chain
      const createdPath = await tx.path.create({
        data: {
          PathName:     pathName,
          AccessToggle: accessToggle,
          Date:         date,
          Start:        startDest.DestinationID,
          End:          endDest.DestinationID,
          PSequenceID:  sequences[0].PSequenceID,
          StatusID:     status.StatusID,
          BuildingID:   buildingId,
        },
      });

      // 7) Upsert DistanceWeight for the Start → End edge.
      //    DistanceWeight has no unique constraint on (From, To), so we check
      //    manually and update the existing row's Weight rather than inserting
      //    a duplicate.
      const existingWeight = await tx.distanceWeight.findFirst({
        where: { From: startDest.DestinationID, To: endDest.DestinationID },
      });

      const distanceWeight = existingWeight
        ? await tx.distanceWeight.update({
            where: { DistanceWeightID: existingWeight.DistanceWeightID },
            data:  { Weight: weight },
          })
        : await tx.distanceWeight.create({
            data: {
              From:   startDest.DestinationID,
              To:     endDest.DestinationID,
              Weight: weight,
            },
          });

      return {
        createdPath,
        startDest,
        endDest,
        status,
        media:          createdMedia,
        sequences,
        distanceWeight,
      };
    });

    return NextResponse.json({ ok: true, result }, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/path] POST failed:", msg, err);
    return NextResponse.json(
      { error: "Failed to upload path", details: msg },
      { status: 500 }
    );
  }
}