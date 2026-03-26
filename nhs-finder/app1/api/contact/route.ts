import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
/** 
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.name || !body?.email || !body?.message || !body?.category) {
      return NextResponse.json(
        { error: "Name, email, category, and message are required" },
        { status: 400 }
      );
    }

    const saved = await prisma.contactMessage.create({
      data: {
        FullName: String(body.name),
        Email: String(body.email),
        Phone: body.phone ? String(body.phone) : null,
        Category: String(body.category),
        Building: body.building ? String(body.building) : null,
        Message: String(body.message),
        Date: new Date().toISOString(),
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return NextResponse.json(
      { error: "Failed to save contact message" },
      { status: 500 }
    );
  }
}
  */
