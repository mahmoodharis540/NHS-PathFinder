import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pathId  = parseInt(id, 10);

  if (isNaN(pathId)) {
    return Response.json({ error: "Invalid path ID" }, { status: 400 });
  }

  try {
    const path = await prisma.path.findUnique({
      where:   { PathID: pathId },
      include: {
        PSequence: {
          include: { Media_PSequence_MediaIDToMedia: true },
        },
      },
    });

    if (!path) {
      return Response.json({ error: "Path not found" }, { status: 404 });
    }

    // Fetch all PSequence nodes to traverse the linked list in memory
    const allNodes = await prisma.pSequence.findMany({
      include: { Media_PSequence_MediaIDToMedia: true },
    });

    const nodeByMediaId = new Map(allNodes.map((n) => [n.MediaID, n]));

    const orderedMedia: Array<{
      pSequenceId: number;
      mediaId:     number;
      media:       string;
      mediaDesc:   string;
    }> = [];

    const startNode    = path.PSequence;
    const startMediaId = startNode.MediaID;
    let   current      = startNode;
    const visited      = new Set<number>();

    while (current && !visited.has(current.MediaID)) {
      visited.add(current.MediaID);

      const mediaPath = current.Media_PSequence_MediaIDToMedia.Media;

      // Skip placeholder sentinel rows — they have no real file on disk.
      // The directions page already handles an empty mediaSequence gracefully
      // by showing "No media for this path segment."
      if (mediaPath !== "/placeholder") {
        orderedMedia.push({
          pSequenceId: current.PSequenceID,
          mediaId:     current.MediaID,
          media:       mediaPath,
          mediaDesc:   current.Media_PSequence_MediaIDToMedia.MediaDesc,
        });
      }

      if (
        current.Next === 0 ||
        current.Next === current.MediaID ||
        current.Next === startMediaId
      ) {
        break;
      }

      const nextNode = nodeByMediaId.get(current.Next);
      if (!nextNode) break;
      current = nextNode;
    }

    return Response.json({ mediaSequence: orderedMedia });
  } catch (error) {
    console.error("GET /api/paths/[id]/sequence error:", error);
    return Response.json({ error: "Failed to fetch media sequence" }, { status: 500 });
  }
}
