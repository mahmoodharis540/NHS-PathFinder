import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pass } = body;

    const login = await prisma.login.findFirst({
      where: {
        Code: pass,
      },
    });

    return NextResponse.json({
      success: !!login,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
