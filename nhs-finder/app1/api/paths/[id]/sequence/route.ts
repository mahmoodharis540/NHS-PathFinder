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
    // Fetch the path and its PSequence.
    // PSequence now only has Prev and Next (both MediaIDs) — no MediaID of its own.
    const pathRow = await prisma.path.findUnique({
      where:   { PathID: pathId },
      include: {
        PSequence: {
          include: {
            Media_PSequence_PrevToMedia: true,
            Media_PSequence_NextToMedia: true,
          },
        },
      },
    });

    if (!pathRow) {
      return Response.json({ error: "Path not found" }, { status: 404 });
    }

    const seq = pathRow.PSequence;

    const orderedMedia: Array<{
      pSequenceId: number;
      mediaId:     number;
      media:       string;
      mediaDesc:   string;
    }> = [];

    // Add the "from" node image (Prev) if it's a real file
    if (seq.Media_PSequence_PrevToMedia.Media !== "/placeholder") {
      orderedMedia.push({
        pSequenceId: seq.PSequenceID,
        mediaId:     seq.Prev,
        media:       seq.Media_PSequence_PrevToMedia.Media,
        mediaDesc:   seq.Media_PSequence_PrevToMedia.MediaDesc,
      });
    }

    // Add the "to" node image (Next) if it's a real file and different from Prev
    // (skip when Prev === Next, which happens when both nodes share the placeholder)
    if (
      seq.Next !== seq.Prev &&
      seq.Media_PSequence_NextToMedia.Media !== "/placeholder"
    ) {
      orderedMedia.push({
        pSequenceId: seq.PSequenceID,
        mediaId:     seq.Next,
        media:       seq.Media_PSequence_NextToMedia.Media,
        mediaDesc:   seq.Media_PSequence_NextToMedia.MediaDesc,
      });
    }

    // orderedMedia is empty when both nodes have no real image yet.
    // The directions page already handles this gracefully with
    // "No media for this path segment."
    return Response.json({ mediaSequence: orderedMedia });

  } catch (error) {
    console.error("GET /api/paths/[id]/sequence error:", error);
    return Response.json({ error: "Failed to fetch media sequence" }, { status: 500 });
  }
}