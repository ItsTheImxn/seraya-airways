
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pnr = String(body.pnr || "").trim().toUpperCase();
    const email = String(body.email || "").trim().toLowerCase();

    if (!/^SY[A-HJ-NP-Z2-9]{6}$/.test(pnr)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking reference." },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, message: "Server configuration error." },
        { status: 500 }
      );
    }

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
        "seat_number",
        "gate",
        "boarding_time",
        "check_in_status",
        "checked_in_at",
        "boarding_pass_issued_at",
      ].join(","),
      pnr: `eq.${pnr}`,
      passenger_email: `eq.${email}`,
      limit: "1",
    });

    const response = await fetch(
      `${supabaseUrl}/rest/v1/bookings?${query.toString()}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Booking lookup failed.");
    }

    const bookings = await response.json();

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "We couldn't find a booking with those details.",
        },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    if (booking.booking_status !== "confirmed") {
      return NextResponse.json(
        {
          success: false,
          message: "This booking is not eligible for a boarding pass.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      boardingPass: {
        pnr: booking.pnr,
        passengerName: booking.passenger_name,
        flightNumber: booking.flight_number,
        origin: booking.origin,
        destination: booking.destination,
        departureDate: booking.departure_date,
        bookingStatus: booking.booking_status,
        seatNumber: booking.seat_number,
        gate: booking.gate,
        boardingTime: booking.boarding_time,
        checkInStatus: booking.check_in_status,
        checkedInAt: booking.checked_in_at,
        issuedAt: booking.boarding_pass_issued_at,
      },
    });
  } catch (error) {
    console.error("Boarding pass error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve your boarding pass." },
      { status: 500 }
    );
  }
}
