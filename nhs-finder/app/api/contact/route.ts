import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.name || !body?.email || !body?.message) {
    return Response.json(
      { error: "name, email, and message are required" },
      { status: 400 }
    );
  }

  const saved = await prisma.contactMessage.create({
    data: {
      name: String(body.name),
      email: String(body.email),
      subject: body.subject ? String(body.subject) : null,
      message: String(body.message),
    },
  });

  return Response.json({ ok: true, id: saved.id }, { status: 201 });
}
