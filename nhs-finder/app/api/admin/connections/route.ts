import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function safeFileName(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// ─── POST /api/admin/connections ─────────────────────────────────────────────
//
// Accepts multipart/form-data:
//   fromId      string  — DestinationID of the start node
//   toId        string  — DestinationID of the end node
//   weight      string  — edge weight (positive integer, default 1)
//   accessible  "1"|"0" — sets AccessToggle on the Path row
//   buildingId  string  — BuildingID for the Path row
//   files       File[]  — (optional) media images/videos for the slideshow
//
// Writes per transaction:
//   Media[]      — one row per uploaded file (real path), OR a shared
//                  sentinel row ("/placeholder") when no files given
//   PSequence    — linked-list chain through the Media rows
//   Path         — directed edge fromId → toId
//   DistanceWeight — weighted edge for Dijkstra in /api/bfs

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const fromId     = Number(form.get("fromId"));
    const toId       = Number(form.get("toId"));
    const buildingId = Number(form.get("buildingId"));
    const weightRaw  = Number(form.get("weight") ?? 1);
    const weight     = Number.isFinite(weightRaw) && weightRaw > 0 ? Math.round(weightRaw) : 1;
    const accessible = form.get("accessible") === "1" ? 1 : 0;
    const description = String(form.get("description") ?? "").trim();

    const files = form.getAll("files").filter((f) => f instanceof File && f.size > 0) as File[];

    // ── Validation ────────────────────────────────────────────────────────
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

    // ── Verify both destinations exist ────────────────────────────────────
    const [fromDest, toDest] = await Promise.all([
      prisma.destination.findUnique({
        where:  { DestinationID: fromId },
        select: { DestinationID: true, DestinationName: true },
      }),
      prisma.destination.findUnique({
        where:  { DestinationID: toId },
        select: { DestinationID: true, DestinationName: true },
      }),
    ]);

    if (!fromDest) {
      return NextResponse.json({ error: `Start node not found: ID ${fromId}` }, { status: 404 });
    }
    if (!toDest) {
      return NextResponse.json({ error: `End node not found: ID ${toId}` }, { status: 404 });
    }

    // ── Save files to disk before the transaction ─────────────────────────
    // File I/O outside the transaction avoids holding the SQLite write lock
    // while doing slow disk work.
    const savedPaths: string[] = [];

    if (files.length > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      for (const file of files) {
        const buffer   = Buffer.from(await file.arrayBuffer());
        const stamp    = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const filename = `${stamp}-${safeFileName(file.name)}`;
        await writeFile(path.join(uploadsDir, filename), buffer);
        savedPaths.push(`/uploads/${filename}`);
      }
    }

    // ── Transaction ───────────────────────────────────────────────────────
    const today  = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const defaultDesc = description || `${fromDest.DestinationName} → ${toDest.DestinationName}`;

    const result = await prisma.$transaction(async (tx) => {

      // 1) Status
      const status = await tx.status.upsert({
        where:  { StatusType: "Active" },
        update: {},
        create: { StatusType: "Active" },
      });

      // 2) Media rows
      //    - If files were uploaded: create one Media row per file with the
      //      real disk path.
      //    - If no files: find-or-create a single shared "/placeholder" sentinel
      //      so the Path has a valid FK without polluting the DB with duplicates.
      let createdMedia: Array<{ MediaID: number }>;

      if (savedPaths.length > 0) {
        createdMedia = await Promise.all(
          savedPaths.map((filePath) =>
            tx.media.create({
              data: {
                Media:     filePath,
                MediaDesc: defaultDesc,
              },
            })
          )
        );
      } else {
        // Reuse an existing placeholder rather than creating a new one each time
        const existing = await tx.media.findFirst({
          where: { Media: "/placeholder" },
          select: { MediaID: true },
        });

        createdMedia = [
          existing ??
          (await tx.media.create({
            data: { Media: "/placeholder", MediaDesc: "No media" },
          })),
        ];
      }

      // 3) PSequence linked-list chain
      //    Prev = previous MediaID (self for first), Next = next MediaID (self for last)
      const sequences: Array<{ PSequenceID: number }> = [];
      for (let i = 0; i < createdMedia.length; i++) {
        const prevId = createdMedia[i - 1]?.MediaID ?? createdMedia[i].MediaID;
        const nextId = createdMedia[i + 1]?.MediaID ?? createdMedia[i].MediaID;
        const seq = await tx.pSequence.create({
          data: {
            MediaID: createdMedia[i].MediaID,
            Prev:    prevId,
            Next:    nextId,
          },
        });
        sequences.push(seq);
      }

      // 4) Path
      const createdPath = await tx.path.create({
        data: {
          PathName:     `${fromDest.DestinationName} → ${toDest.DestinationName}`,
          AccessToggle: accessible,
          Date:         dateStr,
          Start:        fromId,
          End:          toId,
          PSequenceID:  sequences[0].PSequenceID,
          StatusID:     status.StatusID,
          BuildingID:   buildingId,
        },
      });

      // 5) DistanceWeight — update existing (From, To) row or create new one
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

      return { createdPath, sequences, media: createdMedia, distanceWeight, savedPaths };
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
