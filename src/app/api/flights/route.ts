
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return Response.json(
      { error: "Flight service is not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/flights?select=id,flight_number,origin_code,destination_code,origin_name,destination_name,aircraft,departure_time,arrival_time,duration,base_fare&is_active=eq.true&order=departure_time.asc`,
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
