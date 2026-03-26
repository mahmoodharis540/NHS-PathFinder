import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing text or targetLanguage" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        targetLanguage
      )}&dt=t&q=${encodeURIComponent(text)}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Translation request failed" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const translatedText =
      Array.isArray(data?.[0]) ? data[0].map((part: any) => part[0]).join("") : text;

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}   