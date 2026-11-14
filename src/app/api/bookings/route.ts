
import { randomInt } from "crypto";

export const runtime = "nodejs";

function makePnr() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "SY";

  for (let i = 0; i < 6; i++) {
    value += alphabet[randomInt(alphabet.length)];
  }

  return value;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: "Booking service is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const flight = String(body.flight || "").trim();
    const from = String(body.from || "").trim().toUpperCase();
    const to = String(body.to || "").trim().toUpperCase();
    const depart = String(body.depart || "").trim();

    if (
      !name ||
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !flight ||
      !from ||
      !to ||
      !/^\d{4}-\d{2}-\d{2}$/.test(depart)
    ) {
      return Response.json(
        { error: "Some booking details are invalid." },
        { status: 400 }
      );
    }

    const baseUrl = supabaseUrl.replace(/\/$/, "");

    for (let attempt = 0; attempt < 3; attempt++) {
      const pnr = makePnr();

      const response = await fetch(
        `${baseUrl}/rest/v1/bookings`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            pnr,
            passenger_name: name,
            passenger_email: email,
            flight_number: flight,
            origin: from,
            destination: to,
            departure_date: depart,
            booking_status: "confirmed",
          }),
          cache: "no-store",
        }
      );

      if (response.ok) {
        const rows = await response.json();
        const booking = rows[0];

        return Response.json({
          success: true,
          booking: {
            pnr: booking.pnr,
            passenger_name: booking.passenger_name,
            flight_number: booking.flight_number,
            origin: booking.origin,
            destination: booking.destination,
            departure_date: booking.departure_date,
          },
        });
      }

      if (response.status !== 409) {
        console.error("Supabase error:", await response.text());

        return Response.json(
          { error: "We couldn't save your booking. Please try again." },
          { status: 502 }
        );
      }
    }

    return Response.json(
      { error: "Please try again." },
      { status: 503 }
    );

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Unable to complete booking." },
      { status: 500 }
    );
  }
}
