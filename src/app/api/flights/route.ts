
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return Response.json(
      { error: "Flight service is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const depart = searchParams.get("depart") || "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(depart)) {
    return Response.json(
      { error: "Please select a valid departure date." },
      { status: 400 }
    );
  }

  try {
    const query = new URLSearchParams({
      select: "id,flight_number,departure_date,origin_code,destination_code,origin_name,destination_name,aircraft,departure_time,arrival_time,duration,base_fare",
      is_active: "eq.true",
      departure_date: `eq.${depart}`,
      order: "departure_time.asc",
    });

    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/flights?${query.toString()}`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Public flights API error:", data);

      return Response.json(
        { error: "Could not retrieve available flights." },
        { status: 502 }
      );
    }

    return Response.json({ flights: data });
  } catch (error) {
    console.error("Public flights API error:", error);

    return Response.json(
      { error: "Flight service is temporarily unavailable." },
      { status: 500 }
    );
  }
}
