import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PathNode {
  PathID: number;
  PathName: string;
  Start: number;
  End: number;
  PSequenceID: number;
  StatusID: number;
  AccessToggle: number;
  BuildingID: number;
  startName: string | null;
  endName: string | null;
}


function dijkstra(
  startId: number,
  endId: number,
  paths: PathNode[],
  weightMap: Map<string, number>
): PathNode[] | null {
  if (startId === endId) return [];

  
  const adj = new Map<number, PathNode[]>();
  for (const p of paths) {
    if (!adj.has(p.Start)) adj.set(p.Start, []);
    adj.get(p.Start)!.push(p);
  }


  const dist = new Map<number, number>([[startId, 0]]);
  const prev = new Map<number, PathNode>();

  const pq: Array<[number, number]> = [[0, startId]];

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [cost, node] = pq.shift()!;

    if (node === endId) break;

    
    if (cost > (dist.get(node) ?? Infinity)) continue;

    for (const path of adj.get(node) ?? []) {
      const edgeKey = `${path.Start},${path.End}`;
      const weight  = weightMap.get(edgeKey) ?? 1; // default weight = 1
      const newCost = cost + weight;

      if (newCost < (dist.get(path.End) ?? Infinity)) {
        dist.set(path.End, newCost);
        prev.set(path.End, path);
        pq.push([newCost, path.End]);
      }
    }
  }

  if (!prev.has(endId)) return null;


  const route: PathNode[] = [];
  let cur = endId;
  while (cur !== startId) {
    const p = prev.get(cur);
    if (!p) return null;
    route.unshift(p);
    cur = p.Start;
  }
  return route;
}



export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entrance    = (searchParams.get("entrance")    ?? "").trim();
  const destination = (searchParams.get("destination") ?? "").trim();

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
      weightMap
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
