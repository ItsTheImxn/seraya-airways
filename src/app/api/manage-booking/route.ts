
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRobloxUser(value: string | undefined, secret: string | undefined) {
  if (!value || !secret) return null;

  try {
    const separator = value.lastIndexOf(".");
    if (separator === -1) return null;

    const payload = value.slice(0, separator);
    const signature = value.slice(separator + 1);

    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const actualBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const user = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      typeof user.id !== "string" ||
      !/^\d+$/.test(user.id)
    ) {
      return null;
    }

    return user as {
      id: string;
      username: string;
      displayName: string;
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const roblox = getRobloxUser(
      cookieStore.get("seraya_roblox")?.value,
      process.env.ROBLOX_CLIENT_SECRET
    );

    if (!roblox) {
      return Response.json(
        { error: "Please connect your Roblox account first." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: "Booking service is unavailable." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const pnr = String(body.pnr || "").trim().toUpperCase();

    if (!/^SY[A-HJ-NP-Z2-9]{6}$/.test(pnr)) {
      return Response.json(
        { error: "Please enter a valid booking reference." },
        { status: 400 }
      );
    }

    const query = new URLSearchParams({
      select: [
        "pnr",
        "roblox_user_id",
        "roblox_username",
        "roblox_display_name",
        "flight_number",
        "origin",
        "destination",
        "departure_date",
        "booking_status",
        "created_at",
      ].join(","),
      pnr: `eq.${pnr}`,
      roblox_user_id: `eq.${roblox.id}`,
      limit: "1",
    });

    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/bookings?${query}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Manage booking lookup failed:", response.status);

      return Response.json(
        { error: "Unable to retrieve your booking right now." },
        { status: 502 }
      );
    }

    const rows = await response.json();

    if (!rows.length) {
      return Response.json(
        { error: "We couldn't find a booking matching your PNR and Roblox account." },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      booking: rows[0],
    });
  } catch (error) {
    console.error("Manage booking error:", error);

    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
