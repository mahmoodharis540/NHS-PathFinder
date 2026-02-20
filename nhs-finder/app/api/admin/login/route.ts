import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { pass } = body;

    if (!pass) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const login = await prisma.login.findUnique({
      where: {
        Code: pass,
      },
    });

    if (!login) {
      return NextResponse.json({ success: false });
    }


    const response = NextResponse.json({ success: true });

    response.cookies.set("admin-auth", "true", {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
