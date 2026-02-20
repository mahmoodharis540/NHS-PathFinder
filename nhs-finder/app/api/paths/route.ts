import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/paths
// Optional query params: ?entrance=<name>&destination=<name>
// Without params → returns all paths (used by admin/staff portal)
// With params    → resolves names to IDs first, then filters paths by Start/End
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entrance    = searchParams.get("entrance");
  const destination = searchParams.get("destination");

  try {
    // If filtering by name, resolve each name to its DestinationID first
    let startId: number | undefined;
    let endId:   number | undefined;

    if (entrance) {
      const start = await prisma.destination.findFirst({
        where: { DestinationName: entrance },
        select: { DestinationID: true },
      });
      if (!start) return Response.json({ paths: [] });
      startId = start.DestinationID;
    }

    if (destination) {
      const end = await prisma.destination.findFirst({
        where: { DestinationName: destination },
        select: { DestinationID: true },
      });
      if (!end) return Response.json({ paths: [] });
      endId = end.DestinationID;
    }

    const paths = await prisma.path.findMany({
      where: {
        ...(startId !== undefined && { Start: startId }),
        ...(endId   !== undefined && { End:   endId   }),
      },
      include: {
        Building: true,
        Destination_Path_StartToDestination: true,
        Destination_Path_EndToDestination: true,
        Status: true,
        PSequence: {
          include: {
            Media_PSequence_MediaIDToMedia: true,
          },
        },
      },
      orderBy: { PathID: "asc" },
    });

    return Response.json({ paths });
  } catch (err) {
    console.error("GET /api/paths error:", err);
    return Response.json({ error: "Failed to fetch paths" }, { status: 500 });
  }
}

// POST /api/paths
// Creates a new path — used by the staff/admin portal
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.PathName) {
      return Response.json({ error: "PathName is required" }, { status: 400 });
    }
    if (!body?.BuildingID || !body?.Start || !body?.End || !body?.PSequenceID || !body?.StatusID) {
      return Response.json(
        { error: "BuildingID, Start, End, PSequenceID and StatusID are required" },
        { status: 400 }
      );
    }

    const created = await prisma.path.create({
      data: {
        PathName:     body.PathName,
        AccessToggle: body.AccessToggle ?? 0,
        Date:         body.Date         ?? new Date().toISOString().slice(0, 10),
        Start:        body.Start,
        End:          body.End,
        PSequenceID:  body.PSequenceID,
        StatusID:     body.StatusID,
        BuildingID:   body.BuildingID,
      },
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/paths error:", err);
    return Response.json({ error: "Failed to create path" }, { status: 500 });
  }
}