import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const entrance = (url.searchParams.get("entrance") ?? "").trim();
  const destination = (url.searchParams.get("destination") ?? "").trim();

  if (!entrance || !destination) {
    return Response.json({ error: "Missing entrance or destination" }, { status: 400 });
  }

  // Find start/end destination rows by name (DestinationName is UNIQUE in your schema)
  const start = await prisma.destination.findUnique({ where: { DestinationName: entrance } });
  const end = await prisma.destination.findUnique({ where: { DestinationName: destination } });

  if (!start || !end) {
    return Response.json({ error: "Start or end destination not found" }, { status: 404 });
  }

  // Find a matching path (prefer Active if you use that)
  const path = await prisma.path.findFirst({
    where: {
      Start: start.DestinationID,
      End: end.DestinationID,
    },
    include: {
      Status: true,
    },
    orderBy: { PathID: "desc" },
  });

  if (!path) {
    return Response.json({ error: "No path found for that entrance + destination" }, { status: 404 });
  }

  // Traverse the PSequence chain.
  // Your admin upload sets:
  // - first node = path.PSequenceID
  // - each node points to MediaID, and Next/Prev are MediaIDs
  const steps: { mediaId: number; url: string; desc: string }[] = [];
  const seen = new Set<number>();

  let currentSeq = await prisma.pSequence.findUnique({
    where: { PSequenceID: path.PSequenceID },
    include: { Media_PSequence_MediaIDToMedia: true },
  });

  while (currentSeq && !seen.has(currentSeq.PSequenceID)) {
    seen.add(currentSeq.PSequenceID);

    const m = currentSeq.Media_PSequence_MediaIDToMedia;
    steps.push({
      mediaId: m.MediaID,
      url: m.Media,
      desc: m.MediaDesc,
    });

    // stop condition: last points Next to itself (your upload code does this)
    if (currentSeq.Next === currentSeq.MediaID) break;

    // find the next node by MediaID and Prev relationship
    const nextSeq = await prisma.pSequence.findFirst({
      where: { MediaID: currentSeq.Next, Prev: currentSeq.MediaID },
      include: { Media_PSequence_MediaIDToMedia: true },
    });

    if (!nextSeq) break;
    currentSeq = nextSeq;
  }

  return Response.json({
    pathId: path.PathID,
    pathName: path.PathName,
    status: path.Status?.StatusType ?? null,
    entrance,
    destination,
    steps,
  });
}
