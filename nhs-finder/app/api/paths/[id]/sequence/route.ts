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

    if (seq.Media_PSequence_PrevToMedia.Media !== "/placeholder") {
      orderedMedia.push({
        pSequenceId: seq.PSequenceID,
        mediaId:     seq.Prev,
        media:       seq.Media_PSequence_PrevToMedia.Media,
        mediaDesc:   seq.Media_PSequence_PrevToMedia.MediaDesc,
      });
    }

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

    return Response.json({ mediaSequence: orderedMedia });

  } catch (error) {
    console.error("GET /api/paths/[id]/sequence error:", error);
    return Response.json({ error: "Failed to fetch media sequence" }, { status: 500 });
  }
}
