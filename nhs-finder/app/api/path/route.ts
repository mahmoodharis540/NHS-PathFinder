import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const paths = await prisma.path.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(paths);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const created = await prisma.path.create({
    data: {
      name: body.name,
      building: body.building ?? null,
      routeSummary: body.routeSummary ?? null,
      status: body.status ?? "Active",
      notes: body.notes ?? null,
    },
  });

  return Response.json(created, { status: 201 });
}
