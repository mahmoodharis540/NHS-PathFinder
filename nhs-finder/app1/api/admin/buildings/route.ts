import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Building name is required" }, { status: 400 });
    }

    const existing = await prisma.building.findFirst({
      where: { BuildingName: { equals: name } },
      select: { BuildingID: true, BuildingName: true },
    });

    if (existing) return NextResponse.json(existing);

    const created = await prisma.building.create({
      data: { BuildingName: name },
      select: { BuildingID: true, BuildingName: true },
    });

    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create building", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
