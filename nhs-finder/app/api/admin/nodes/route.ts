import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePositiveInt(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function safeFileName(original: string) {
  return original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const take = Math.min(Number(searchParams.get("take") ?? 200) || 200, 500);
    const buildingId = parsePositiveInt(searchParams.get("buildingId"));

    const isEntranceParam = searchParams.get("isEntrance");
    const isEntrance =
      isEntranceParam === "0" || isEntranceParam === "1" ? Number(isEntranceParam) : null;

    const nodes = await prisma.destination.findMany({
      where: {
        ...(buildingId ? { BuildingID: buildingId } : {}),
        ...(isEntrance === 0 || isEntrance === 1 ? { isEntrance } : {}),
        ...(q ? { DestinationName: { contains: q } } : {}),
      },
      orderBy: { DestinationName: "asc" },
      take,
      select: {
        DestinationID: true,
        DestinationName: true,
        BuildingID: true,
        isEntrance: true,
        Accessibility: true,
      },
    });

    if (nodes.length === 0) {
      return NextResponse.json([]);
    }

    const nodeIds = nodes.map((node) => node.DestinationID);
    const connectedNamesById = new Map<number, Set<string>>();

    for (const nodeId of nodeIds) {
      connectedNamesById.set(nodeId, new Set());
    }

    const paths = await prisma.path.findMany({
      where: {
        ...(buildingId ? { BuildingID: buildingId } : {}),
        OR: [{ Start: { in: nodeIds } }, { End: { in: nodeIds } }],
      },
      select: {
        Start: true,
        End: true,
        Destination_Path_StartToDestination: {
          select: { DestinationName: true },
        },
        Destination_Path_EndToDestination: {
          select: { DestinationName: true },
        },
      },
    });

    for (const route of paths) {
      const startConnections = connectedNamesById.get(route.Start);
      const endConnections = connectedNamesById.get(route.End);

      if (
        startConnections &&
        route.Destination_Path_EndToDestination.DestinationName &&
        route.Start !== route.End
      ) {
        startConnections.add(route.Destination_Path_EndToDestination.DestinationName);
      }

      if (
        endConnections &&
        route.Destination_Path_StartToDestination.DestinationName &&
        route.Start !== route.End
      ) {
        endConnections.add(route.Destination_Path_StartToDestination.DestinationName);
      }
    }

    const payload = nodes.map((node) => {
      const connectedNodes = Array.from(connectedNamesById.get(node.DestinationID) ?? []).sort(
        (a, b) => a.localeCompare(b)
      );

      return {
        ...node,
        connectionCount: connectedNodes.length,
        connectedNodes,
      };
    });

    return NextResponse.json(payload);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch nodes", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const name = String(form.get("name") ?? "").trim();
    const buildingId = Number(form.get("buildingId"));
    const isEntrance = Number(form.get("isEntrance") ?? "0");
    const accessibility = form.get("accessibility") === "1" ? 1 : 0;
    const weightRaw = String(form.get("weight") ?? "").trim();
    const weight = weightRaw === "" ? null : Number(weightRaw);
    const image = form.get("image");

    if (!name) {
      return NextResponse.json({ error: "Node name is required" }, { status: 400 });
    }

    if (!buildingId || !Number.isFinite(buildingId) || buildingId <= 0) {
      return NextResponse.json({ error: "Building is required" }, { status: 400 });
    }

    if (!(isEntrance === 0 || isEntrance === 1)) {
      return NextResponse.json({ error: "isEntrance must be 0 or 1" }, { status: 400 });
    }

    if (weight !== null && (!Number.isFinite(weight) || weight < 0)) {
      return NextResponse.json({ error: "Weight must be a non-negative number" }, { status: 400 });
    }

    const existing = await prisma.destination.findUnique({
      where: { DestinationName: name },
      select: { DestinationID: true },
    });

    if (existing) {
      return NextResponse.json({ error: "A node with that name already exists" }, { status: 409 });
    }

    let imagePath: string | null = null;
    if (image instanceof File && image.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const filename = `${stamp}-${safeFileName(image.name)}`;
      const diskPath = path.join(uploadsDir, filename);

      await writeFile(diskPath, buffer);
      imagePath = `/uploads/${filename}`;
    }

    const created = await prisma.destination.create({
      data: {
        DestinationName: name,
        BuildingID: buildingId,
        isEntrance,
        Accessibility: accessibility,
      },
      select: {
        DestinationID: true,
        DestinationName: true,
        BuildingID: true,
        isEntrance: true,
        Accessibility: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to create node", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
