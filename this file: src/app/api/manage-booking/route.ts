
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: "Booking service is unavailable." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const pnr = String(body.pnr || "")
      .trim()
      .toUpperCase();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (
      !/^SY[A-HJ-NP-Z2-9]{6}$/.test(pnr) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json(
        { error: "Please enter a valid booking reference and email." },
        { status: 400 }
      );
    }

    const baseUrl = supabaseUrl.replace(/\/$/, "");

    const query = new URLSearchParams({
      select: [
        "pnr",
        "passenger_name",
        "passenger_email",
        "flight_number",
        "origin",
        "destination",
        "departure_date",
        "booking_status",
        "created_at",
      ].join(","),
      pnr: `eq.${pnr}`,
      passenger_email: `eq.${email}`,
      limit: "1",
    });

    const response = await fetch(
      `${baseUrl}/rest/v1/bookings?${query.toString()}`,
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
        { error: "We couldn't find a booking matching those details." },
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
