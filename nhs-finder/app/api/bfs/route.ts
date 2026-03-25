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

// ─── Dijkstra (weighted shortest path) ───────────────────────────────────────
//
// weightMap key: "<From>,<To>" → weight integer.
// Falls back to weight 1 when no DistanceWeight row exists for an edge,
// so the algorithm degrades gracefully to plain BFS.

function dijkstra(
  startId: number,
  endId: number,
  paths: PathNode[],
  weightMap: Map<string, number>
): PathNode[] | null {
  if (startId === endId) return [];

  // Build adjacency list: destinationID → outgoing paths
  const adj = new Map<number, PathNode[]>();
  for (const p of paths) {
    if (!adj.has(p.Start)) adj.set(p.Start, []);
    adj.get(p.Start)!.push(p);
  }

  // dist: best known cumulative cost to reach a node
  const dist = new Map<number, number>([[startId, 0]]);
  // prev: the path edge we used to reach each node on the best route
  const prev = new Map<number, PathNode>();

  // Priority queue: [cumulativeCost, destinationID]
  // Kept sorted after each insertion; graph sizes here are small so
  // O(n log n) sort per iteration is fine — swap for a binary heap if needed.
  const pq: Array<[number, number]> = [[0, startId]];

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [cost, node] = pq.shift()!;

    if (node === endId) break;

    // Stale entry — a cheaper path to this node was already found
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

  // Reconstruct the route by walking back through `prev`
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

// ─── GET /api/bfs?entrance=<name>&destination=<name> ─────────────────────────

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
    // 1. Resolve names → DestinationIDs
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

    // 2. Load all active paths + all distance weights in parallel
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

    // 3. Build the weight lookup map keyed by "From,To"
    const weightMap = new Map<string, number>();
    for (const dw of allWeights) {
      weightMap.set(`${dw.From},${dw.To}`, dw.Weight);
    }

    // 4. Normalise path records into PathNode shape
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

    // 5. Run Dijkstra
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

    // 6. Return leg summaries — media is fetched client-side per leg
    //    via GET /api/paths/[id]/sequence
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
