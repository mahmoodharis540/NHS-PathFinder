import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Contact form submission is not configured" },
    { status: 501 }
  );
}
