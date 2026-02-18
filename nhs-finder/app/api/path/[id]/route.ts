import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();

    // Only include fields that are present in your DB schema
    const data: any = {};

    if (body.PathName !== undefined) data.PathName = String(body.PathName);
    if (body.AccessToggle !== undefined) data.AccessToggle = Number(body.AccessToggle);
    if (body.Date !== undefined) data.Date = String(body.Date);

    if (body.Start !== undefined) data.Start = Number(body.Start);
    if (body.End !== undefined) data.End = Number(body.End);

    if (body.PSequenceID !== undefined) data.PSequenceID = Number(body.PSequenceID);
    if (body.StatusID !== undefined) data.StatusID = Number(body.StatusID);
    if (body.BuildingID !== undefined) data.BuildingID = Number(body.BuildingID);

    const updated = await prisma.path.update({
      where: { PathID: id },
      data,
    });

    return Response.json(updated);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to update path" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    await prisma.path.delete({ where: { PathID: id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to delete path" }, { status: 500 });
  }
}
