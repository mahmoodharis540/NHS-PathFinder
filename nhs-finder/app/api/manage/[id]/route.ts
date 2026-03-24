import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile, unlink } from "fs/promises";

function getIdFromUrl(req: Request) {
  const { pathname } = new URL(req.url);
  return pathname.split("/").filter(Boolean).pop() ?? "";
}

function parseNumericId(raw: string) {
  if (!raw || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

function isEntranceName(name: string) {
  return /entrance/i.test(name) ? 1 : 0;
}

function safeFileName(original: string) {
  return original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

type OrderedMediaItem = {
  MediaID: number;
  Media: string;
  MediaDesc: string | null;
};

type SequenceWithMedia = {
  PSequenceID: number;
  MediaID: number;
  Prev: number;
  Next: number;
  Media_PSequence_MediaIDToMedia: {
    MediaID: number;
    Media: string;
    MediaDesc: string | null;
  } | null;
};

type SequenceLookup = {
  PSequenceID: number;
  MediaID: number;
  Prev: number;
  Next: number;
} | null;

async function getOrderedMediaFromSequence(
  pSequenceId: number
): Promise<OrderedMediaItem[]> {
  const mediaItems: OrderedMediaItem[] = [];
  const visitedSequenceIds = new Set<number>();

  let currentSequenceId: number | null = pSequenceId;

  while (currentSequenceId && !visitedSequenceIds.has(currentSequenceId)) {
    visitedSequenceIds.add(currentSequenceId);

    const seq: SequenceWithMedia | null = await prisma.pSequence.findUnique({
      where: { PSequenceID: currentSequenceId },
      include: {
        Media_PSequence_MediaIDToMedia: true,
      },
    });

    if (!seq) break;

    if (seq.Media_PSequence_MediaIDToMedia) {
      mediaItems.push({
        MediaID: seq.Media_PSequence_MediaIDToMedia.MediaID,
        Media: seq.Media_PSequence_MediaIDToMedia.Media,
        MediaDesc: seq.Media_PSequence_MediaIDToMedia.MediaDesc,
      });
    }

    if (!seq.Next || seq.Next === seq.MediaID) break;

    const nextSeq: SequenceLookup = await prisma.pSequence.findFirst({
      where: { MediaID: seq.Next },
      select: {
        PSequenceID: true,
        MediaID: true,
        Prev: true,
        Next: true,
      },
    });

    if (!nextSeq) break;

    currentSequenceId = nextSeq.PSequenceID;
  }

  return mediaItems;
}

export async function GET(req: Request) {
  const raw = getIdFromUrl(req);
  const id = parseNumericId(raw);

  if (id === null) {
    return NextResponse.json(
      { ok: false, error: `Invalid ID in URL: "${raw}"` },
      { status: 400 }
    );
  }

  try {
    const row = await prisma.path.findUnique({
      where: { PathID: id },
      include: {
        Building: true,
        Status: true,
        Destination_Path_StartToDestination: true,
        Destination_Path_EndToDestination: true,
      },
    });

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    const media = await getOrderedMediaFromSequence(row.PSequenceID);
    const description = media[0]?.MediaDesc ?? "";

    return NextResponse.json({
      ok: true,
      path: {
        id: row.PathID,
        pathName: row.PathName,
        buildingId: row.BuildingID,
        building: row.Building?.BuildingName ?? "",
        startId: row.Start,
        endId: row.End,
        startName:
          row.Destination_Path_StartToDestination?.DestinationName ?? "",
        endName:
          row.Destination_Path_EndToDestination?.DestinationName ?? "",
        statusId: row.StatusID,
        statusType: row.Status?.StatusType ?? "Active",
        accessToggle: row.AccessToggle,
        date: row.Date ?? "",
        description,
        media,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Fetch failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const raw = getIdFromUrl(req);
  const id = parseNumericId(raw);

  if (id === null) {
    return NextResponse.json(
      { ok: false, error: `Invalid ID in URL: "${raw}"` },
      { status: 400 }
    );
  }

  try {
    const form = await req.formData();

    const buildingId = Number(form.get("buildingId"));
    const pathName = String(form.get("pathName") ?? "").trim();
    const startName = String(form.get("startName") ?? "").trim();
    const endName = String(form.get("endName") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const statusType =
      String(form.get("statusType") ?? "Active").trim() || "Active";
    const accessToggle = form.get("accessToggle") === "1" ? 1 : 0;

    const today = new Date();
    const defaultDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const date = String(form.get("date") ?? defaultDate).trim() || defaultDate;

    const existingMediaOrder = JSON.parse(
      String(form.get("existingMediaOrder") ?? "[]")
    ) as number[];

    const removedMediaIds = JSON.parse(
      String(form.get("removedMediaIds") ?? "[]")
    ) as number[];

    if (!buildingId || !pathName || !startName || !endName) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing required fields: buildingId, pathName, startName, endName",
        },
        { status: 400 }
      );
    }

    const files = form.getAll("files").filter((f) => f instanceof File) as File[];

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const result = await prisma.$transaction(async (tx) => {
      const existingPath = await tx.path.findUnique({
        where: { PathID: id },
      });

      if (!existingPath) {
        throw new Error("Path not found");
      }

      const status = await tx.status.upsert({
        where: { StatusType: statusType },
        update: {},
        create: { StatusType: statusType },
      });

      const startDest =
        (await tx.destination.findUnique({
          where: { DestinationName: startName },
        })) ??
        (await tx.destination.create({
          data: {
            DestinationName: startName,
            BuildingID: buildingId,
            isEntrance: isEntranceName(startName),
          },
        }));

      const endDest =
        (await tx.destination.findUnique({
          where: { DestinationName: endName },
        })) ??
        (await tx.destination.create({
          data: {
            DestinationName: endName,
            BuildingID: buildingId,
            isEntrance: isEntranceName(endName),
          },
        }));

      const oldMedia = await getOrderedMediaFromSequence(existingPath.PSequenceID);

      const keptOldMediaIds = existingMediaOrder.filter(
        (mediaId) => !removedMediaIds.includes(mediaId)
      );

      for (const removedId of removedMediaIds) {
        const mediaRow = await tx.media.findUnique({
          where: { MediaID: removedId },
        });

        if (mediaRow?.Media?.startsWith("/uploads/")) {
          const filePath = path.join(
            process.cwd(),
            "public",
            mediaRow.Media.replace("/uploads/", "uploads/")
          );
          try {
            await unlink(filePath);
          } catch {}
        }

        await tx.pSequence.deleteMany({
          where: { MediaID: removedId },
        });

        await tx.media.deleteMany({
          where: { MediaID: removedId },
        });
      }

      const keptMediaRows = [];
      for (const mediaId of keptOldMediaIds) {
        const mediaRow = await tx.media.findUnique({
          where: { MediaID: mediaId },
        });
        if (mediaRow) {
          keptMediaRows.push(mediaRow);
        }
      }

      if (description) {
        for (const mediaRow of keptMediaRows) {
          await tx.media.update({
            where: { MediaID: mediaRow.MediaID },
            data: { MediaDesc: description },
          });
        }
      }

      const newMediaRows = [];
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const filename = `${stamp}-${safeFileName(file.name)}`;
        const diskPath = path.join(uploadsDir, filename);

        await writeFile(diskPath, buffer);

        const media = await tx.media.create({
          data: {
            Media: `/uploads/${filename}`,
            MediaDesc: description || `Media for: ${pathName}`,
          },
        });

        newMediaRows.push(media);
      }

      const finalMediaRows = [...keptMediaRows, ...newMediaRows];

      if (finalMediaRows.length === 0) {
        throw new Error("A path must contain at least one media item.");
      }

      await tx.pSequence.deleteMany({
        where: {
          OR: [
            { PSequenceID: existingPath.PSequenceID },
            { MediaID: { in: oldMedia.map((m) => m.MediaID) } },
          ],
        },
      });

      const newSequences = [];
      for (let i = 0; i < finalMediaRows.length; i++) {
        const current = finalMediaRows[i];
        const prevMediaId = finalMediaRows[i - 1]?.MediaID ?? current.MediaID;
        const nextMediaId = finalMediaRows[i + 1]?.MediaID ?? current.MediaID;

        const seq = await tx.pSequence.create({
          data: {
            MediaID: current.MediaID,
            Prev: prevMediaId,
            Next: nextMediaId,
          },
        });

        newSequences.push(seq);
      }

      const updatedPath = await tx.path.update({
        where: { PathID: id },
        data: {
          PathName: pathName,
          BuildingID: buildingId,
          Start: startDest.DestinationID,
          End: endDest.DestinationID,
          StatusID: status.StatusID,
          AccessToggle: accessToggle,
          Date: date,
          PSequenceID: newSequences[0].PSequenceID,
        },
      });

      return updatedPath;
    });

    return NextResponse.json({
      ok: true,
      path: result,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const raw = getIdFromUrl(req);
  const id = parseNumericId(raw);

  if (id === null) {
    return NextResponse.json(
      { ok: false, error: `Invalid ID in URL: "${raw}"` },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.path.findUnique({
      where: { PathID: id },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    await prisma.path.delete({
      where: { PathID: id },
    });

    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}