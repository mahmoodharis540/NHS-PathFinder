import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isEntranceName(name: string) {
  return /entrance/i.test(name) ? 1 : 0;
}

function safeFileName(original: string) {
  // Basic sanitiser for filenames
  return original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const buildingIdRaw = form.get("buildingId");
    const pathNameRaw = form.get("pathName");
    const startNameRaw = form.get("startName");
    const endNameRaw = form.get("endName");
    const descriptionRaw = form.get("description");
    const statusTypeRaw = form.get("statusType"); // "Active" or "Draft"
    const accessToggleRaw = form.get("accessToggle"); // "1" or "0"
    const dateRaw = form.get("date"); // optional

    const buildingId = Number(buildingIdRaw);
    const pathName = String(pathNameRaw ?? "").trim();
    const startName = String(startNameRaw ?? "").trim();
    const endName = String(endNameRaw ?? "").trim();

    const description = String(descriptionRaw ?? "").trim();
    const statusType = String(statusTypeRaw ?? "Active").trim() || "Active";
    const accessToggle = accessToggleRaw === "1" ? 1 : 0;

    // Date in your schema is String; store YYYY-MM-DD
    const today = new Date();
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    const date = String(dateRaw ?? defaultDate).trim() || defaultDate;

    if (!buildingId || !pathName || !startName || !endName) {
      return NextResponse.json(
        { error: "Missing required fields: buildingId, pathName, startName, endName" },
        { status: 400 }
      );
    }

    // Files
    const files = form.getAll("files").filter((f) => f instanceof File) as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least 1 media file (image/video) for the path." },
        { status: 400 }
      );
    }

    // Ensure uploads folder exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Use transaction so DB stays consistent
    const result = await prisma.$transaction(async (tx) => {
      // 1) Status (connectOrCreate)
      const status = await tx.status.upsert({
        where: { StatusType: statusType },
        update: {},
        create: { StatusType: statusType },
      });

      // 2) Start/End destinations (DestinationName is UNIQUE globally in your schema)
      //    If you want same names in different buildings later, you'll need to change schema.
      const startDest =
        (await tx.destination.findUnique({ where: { DestinationName: startName } })) ??
        (await tx.destination.create({
          data: {
            DestinationName: startName,
            BuildingID: buildingId,
            isEntrance: isEntranceName(startName),
          },
        }));

      const endDest =
        (await tx.destination.findUnique({ where: { DestinationName: endName } })) ??
        (await tx.destination.create({
          data: {
            DestinationName: endName,
            BuildingID: buildingId,
            isEntrance: isEntranceName(endName),
          },
        }));

      // 3) Save files to /public/uploads and create Media rows
      const createdMedia = [];
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const filename = `${stamp}-${safeFileName(file.name)}`;
        const diskPath = path.join(uploadsDir, filename);

        await writeFile(diskPath, buffer);

        const media = await tx.media.create({
          data: {
            Media: `/uploads/${filename}`, // store public path
            MediaDesc: description || `Media for: ${pathName}`,
          },
        });

        createdMedia.push(media);
      }

      // 4) Create PSequence chain (Prev/Next are MediaIDs in your schema)
      //    Each PSequence row points to a MediaID, and references Prev/Next media IDs.
      const sequences = [];
      for (let i = 0; i < createdMedia.length; i++) {
        const current = createdMedia[i];
        const prevMediaId = createdMedia[i - 1]?.MediaID ?? current.MediaID; // self for first
        const nextMediaId = createdMedia[i + 1]?.MediaID ?? current.MediaID; // self for last

        const seq = await tx.pSequence.create({
          data: {
            MediaID: current.MediaID,
            Prev: prevMediaId,
            Next: nextMediaId,
          },
        });

        sequences.push(seq);
      }

      // 5) Create Path (must reference PSequenceID, StatusID, Start, End, BuildingID)
      const createdPath = await tx.path.create({
        data: {
          PathName: pathName,
          AccessToggle: accessToggle,
          Date: date,
          Start: startDest.DestinationID,
          End: endDest.DestinationID,
          PSequenceID: sequences[0].PSequenceID, // start of chain
          StatusID: status.StatusID,
          BuildingID: buildingId,
        },
      });

      return {
        createdPath,
        startDest,
        endDest,
        status,
        media: createdMedia,
        sequences,
      };
    });

    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to upload path", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
