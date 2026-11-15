
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { error: "Server configuration is missing." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/airports?select=id,iata_code,airport_name,city,country&is_active=eq.true&order=city.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: "Unable to load airports." },
        { status: 502 }
      );
    }

    const airports = await response.json();

    return Response.json({ airports });
  } catch {
    return Response.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
