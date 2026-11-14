
import { getAdminDiscordId } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FlightInput = {
  flight_number?: unknown;
  origin_code?: unknown;
  destination_code?: unknown;
  origin_name?: unknown;
  destination_name?: unknown;
  aircraft?: unknown;
  departure_time?: unknown;
  arrival_time?: unknown;
  duration?: unknown;
  base_fare?: unknown;
  is_active?: unknown;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function validate(body: FlightInput) {
  const flight = {
    flight_number: clean(body.flight_number).toUpperCase(),
    origin_code: clean(body.origin_code).toUpperCase(),
    destination_code: clean(body.destination_code).toUpperCase(),
    origin_name: clean(body.origin_name),
    destination_name: clean(body.destination_name),
    aircraft: clean(body.aircraft),
    departure_time: clean(body.departure_time),
    arrival_time: clean(body.arrival_time),
    duration: clean(body.duration),
    base_fare: Number(body.base_fare),
    is_active: body.is_active === undefined ? true : Boolean(body.is_active),
  };

  if (
    !flight.flight_number ||
    !/^[A-Z0-9 -]{2,12}$/.test(flight.flight_number) ||
    !/^[A-Z]{3}$/.test(flight.origin_code) ||
    !/^[A-Z]{3}$/.test(flight.destination_code) ||
    flight.origin_code === flight.destination_code ||
    !flight.origin_name ||
    !flight.destination_name ||
    !flight.aircraft ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(flight.departure_time) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(flight.arrival_time) ||
    !flight.duration ||
    !Number.isFinite(flight.base_fare) ||
    flight.base_fare < 0
  ) {
    return null;
  }

  return flight;
}

async function supabaseRequest(path: string, init?: RequestInit) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Flight management is not configured.");
  }

  return fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

async function authorized() {
  return Boolean(await getAdminDiscordId());
}

export async function GET() {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const response = await supabaseRequest(
      "flights?select=*&order=created_at.desc"
    );
    const data = await response.json();

    if (!response.ok) {
      console.error("Flight list error:", data);
      return Response.json(
        { error: "Could not load flights." },
        { status: 502 }
      );
    }

    return Response.json({ flights: data });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Flight service unavailable." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const flight = validate(body);

    if (!flight) {
      return Response.json(
        { error: "Please check all flight details." },
        { status: 400 }
      );
    }

    const response = await supabaseRequest("flights", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(flight),
    });

    const data = await response.json();

    if (!response.ok) {
      const duplicate = response.status === 409;

      return Response.json(
        {
          error: duplicate
            ? "That flight number already exists."
            : "Could not create the flight.",
        },
        { status: duplicate ? 409 : 502 }
      );
    }

    return Response.json({ flight: data[0] }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not create the flight." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = clean(body.id);
    const flight = validate(body);

    if (!id || !flight) {
      return Response.json(
        { error: "Please check the flight details." },
        { status: 400 }
      );
    }

    const response = await supabaseRequest(
      `flights?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          ...flight,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "Could not update the flight." },
        { status: 502 }
      );
    }

    if (!data.length) {
      return Response.json(
        { error: "Flight not found." },
        { status: 404 }
      );
    }

    return Response.json({ flight: data[0] });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not update the flight." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const flightId = clean(id);

    if (!flightId) {
      return Response.json(
        { error: "Flight ID is required." },
        { status: 400 }
      );
    }

    const response = await supabaseRequest(
      `flights?id=eq.${encodeURIComponent(flightId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          is_active: false,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "Could not deactivate the flight." },
        { status: 502 }
      );
    }

    if (!data.length) {
      return Response.json(
        { error: "Flight not found." },
        { status: 404 }
      );
    }

    return Response.json({ success: true, flight: data[0] });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Could not deactivate the flight." },
      { status: 500 }
    );
  }
}
