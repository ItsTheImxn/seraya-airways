
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Brand settings unavailable." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/brand_settings?id=eq.default&select=*`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not load brand settings." },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      settings: data[0] || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Brand settings service unavailable." },
      { status: 500 }
    );
  }
}
