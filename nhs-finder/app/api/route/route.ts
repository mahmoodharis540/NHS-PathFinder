import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url         = new URL(req.url);
  const entrance    = (url.searchParams.get("entrance")    ?? "").trim();
  const destination = (url.searchParams.get("destination") ?? "").trim();

  if (!entrance || !destination) {
    return Response.json({ error: "Missing entrance or destination" }, { status: 400 });
  }

  const [start, end] = await Promise.all([
    prisma.destination.findUnique({ where: { DestinationName: entrance } }),
    prisma.destination.findUnique({ where: { DestinationName: destination } }),
  ]);

  if (!start || !end) {
    return Response.json({ error: "Start or end destination not found" }, { status: 404 });
  }

  const path = await prisma.path.findFirst({
    where:   { Start: start.DestinationID, End: end.DestinationID },
    include: { Status: true },
    orderBy: { PathID: "desc" },
  });

  if (!path) {
    return Response.json(
      { error: "No path found for that entrance + destination" },
      { status: 404 }
    );
  }

  // ── Resolve the PSequence slideshow ──────────────────────────────────────
  //
  // Schema change: PSequence no longer has its own MediaID field.
  // It now only has Prev and Next, both of which are MediaIDs pointing to
  // the from-node and to-node images stored on their Destination rows.
  //
  // Prev → image of the start node (shown first in the slideshow)
  // Next → image of the end node   (shown second)
  //
  // Both relations are included and placeholder rows are filtered out.

  const seq = await prisma.pSequence.findUnique({
    where:   { PSequenceID: path.PSequenceID },
    include: {
      Media_PSequence_PrevToMedia: true,
      Media_PSequence_NextToMedia: true,
    },
  });

  const steps: { mediaId: number; url: string; desc: string }[] = [];

  if (seq) {
    const prev = seq.Media_PSequence_PrevToMedia;
    const next = seq.Media_PSequence_NextToMedia;

    if (prev.Media !== "/placeholder") {
      steps.push({ mediaId: prev.MediaID, url: prev.Media, desc: prev.MediaDesc });
    }

    // Only add the "to" image if it is different from the "from" image
    // (they are the same when both nodes share the placeholder)
    if (next.MediaID !== prev.MediaID && next.Media !== "/placeholder") {
      steps.push({ mediaId: next.MediaID, url: next.Media, desc: next.MediaDesc });
    }
  }

  return Response.json({
    pathId:      path.PathID,
    pathName:    path.PathName,
    status:      path.Status?.StatusType ?? null,
    entrance,
    destination,
    steps,
  });
}