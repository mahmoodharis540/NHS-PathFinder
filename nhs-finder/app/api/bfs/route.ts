import { prisma } from "@/lib/prisma";
import { dijkstra, type PathNode } from "@/lib/dijkstra";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entrance    = (searchParams.get("entrance")    ?? "").trim();
  const destination = (searchParams.get("destination") ?? "").trim();
  const accessibleOnly = searchParams.get("accessible") === "true";

  if (!entrance || !destination) {
    return NextResponse.json(
      { error: "Missing entrance or destination query params" },
      { status: 400 }
    );
  }

  try {
    
    const [startDest, endDest] = await Promise.all([
      prisma.destination.findFirst({
        where:  { DestinationName: entrance },
        select: { DestinationID: true, DestinationName: true },
      }),
      prisma.destination.findFirst({
        where:  { DestinationName: destination },
        select: { DestinationID: true, DestinationName: true },
      }),
    ]);

    if (!startDest) {
      return NextResponse.json(
        { error: `Entrance not found: "${entrance}"` },
        { status: 404 }
      );
    }
    if (!endDest) {
      return NextResponse.json(
        { error: `Destination not found: "${destination}"` },
        { status: 404 }
      );
    }
    if (startDest.DestinationID === endDest.DestinationID) {
      return NextResponse.json({ legs: [], message: "Already there!" });
    }

    
    const [allPaths, allWeights] = await Promise.all([
      prisma.path.findMany({
        where: { Status: { StatusType: "Active" } },
        select: {
          PathID:       true,
          PathName:     true,
          Start:        true,
          End:          true,
          PSequenceID:  true,
          StatusID:     true,
          AccessToggle: true,
          BuildingID:   true,
          Destination_Path_StartToDestination: { select: { DestinationName: true } },
          Destination_Path_EndToDestination:   { select: { DestinationName: true } },
        },
      }),
      prisma.distanceWeight.findMany({
        select: { From: true, To: true, Weight: true },
      }),
    ]);

    
    const weightMap = new Map<string, number>();
    for (const dw of allWeights) {
      weightMap.set(`${dw.From},${dw.To}`, dw.Weight);
    }

    
    const nodes: PathNode[] = allPaths.map((p) => ({
      PathID:       p.PathID,
      PathName:     p.PathName,
      Start:        p.Start,
      End:          p.End,
      PSequenceID:  p.PSequenceID,
      StatusID:     p.StatusID,
      AccessToggle: p.AccessToggle,
      BuildingID:   p.BuildingID,
      startName:    p.Destination_Path_StartToDestination?.DestinationName ?? null,
      endName:      p.Destination_Path_EndToDestination?.DestinationName   ?? null,
    }));

    
    const route = dijkstra(
      startDest.DestinationID,
      endDest.DestinationID,
      nodes,
      weightMap,
      accessibleOnly
    );

    if (route === null) {
      return NextResponse.json(
        { error: "No route found between these locations" },
        { status: 404 }
      );
    }

 
    const legs = route.map((p) => ({
      pathId:    p.PathID,
      pathName:  p.PathName,
      start:     p.Start,
      end:       p.End,
      startName: p.startName,
      endName:   p.endName,
    }));

    return NextResponse.json({
      entrance,
      destination,
      totalLegs: legs.length,
      legs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GET /api/bfs error:", msg);
    return NextResponse.json(
      { error: "Internal server error", details: msg },
      { status: 500 }
    );
  }
}
