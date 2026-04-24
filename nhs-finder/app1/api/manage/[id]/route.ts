import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getIdFromUrl(req: Request) {
  const { pathname } = new URL(req.url);
  // e.g. /api/manage/4 -> "4"
  return pathname.split("/").filter(Boolean).pop() ?? "";
}

function parseNumericId(raw: string) {
  if (!raw || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

export async function GET(req: Request) {
  const raw = getIdFromUrl(req);
  const id = parseNumericId(raw);

  if (id === null) {
    return NextResponse.json(
      { ok: false, error: `Invalid ID in URL: "${raw}"` },
      { status: 400 }
    );
  }

  const row = await prisma.path.findUnique({
    where: { PathID: id },
  });

  if (!row) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const raw = getIdFromUrl(req);
  const id = parseNumericId(raw);

  if (id === null) {
    return NextResponse.json(
      { ok: false, error: `Invalid ID in URL: "${raw}"` },
      { status: 400 }
    );
  }

  try {
    await prisma.path.delete({
      where: { PathID: id },
    });

    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
