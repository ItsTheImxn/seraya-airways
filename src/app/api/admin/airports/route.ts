
import { getAdminDiscordId } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AirportInput = {
  iata_code?: unknown;
  airport_name?: unknown;
  city?: unknown;
  country?: unknown;
  description?: unknown;
  is_active?: unknown;
};

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  return { url: url.replace(/\/$/, ""), key };
}

async function authorized() {
  return Boolean(await getAdminDiscordId());
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validateAirport(input: AirportInput, partial = false) {
  const result: Record<string, string | boolean | null> = {};

  if (!partial || input.iata_code !== undefined) {
    const code = cleanText(input.iata_code, 3).toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      return { error: "Enter a valid three-letter IATA code." };
    }
    result.iata_code = code;
  }

  if (!partial || input.airport_name !== undefined) {
    const name = cleanText(input.airport_name, 120);
    if (!name) return { error: "Airport name is required." };
    result.airport_name = name;
  }

  if (!partial || input.city !== undefined) {
    const city = cleanText(input.city, 100);
    if (!city) return { error: "City is required." };
    result.city = city;
  }

  if (!partial || input.country !== undefined) {
    const country = cleanText(input.country, 100);
    if (!country) return { error: "Country is required." };
    result.country = country;
  }

  if (input.description !== undefined) {
    const description = cleanText(input.description, 500);
    result.description = description || null;
  } else if (!partial) {
    result.description = null;
  }

  if (input.is_active !== undefined) {
    if (typeof input.is_active !== "boolean") {
      return { error: "Airport status must be active or inactive." };
    }
    result.is_active = input.is_active;
  } else if (!partial) {
    result.is_active = true;
  }

  return { data: result };
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, key } = getConfig();

  return fetch(`${url}/rest/v1/airports${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
}

// GET — List airports
export async function GET() {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const response = await supabaseRequest(
      "?select=id,iata_code,airport_name,city,country,description,is_active,created_at,updated_at&order=city.asc,iata_code.asc"
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Airport list error:", data);
      return Response.json(
        { error: "Could not load airports." },
        { status: 502 }
      );
    }

    return Response.json({ airports: data });
  } catch (error) {
    console.error("Airport list error:", error);
    return Response.json(
      { error: "Airport service unavailable." },
      { status: 500 }
    );
  }
}

// POST — Create airport
export async function POST(request: Request) {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AirportInput;
    const validated = validateAirport(body);

    if ("error" in validated) {
      return Response.json(
        { error: validated.error },
        { status: 400 }
      );
    }

    const response = await supabaseRequest("?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(validated.data),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Airport create error:", data);
      const duplicate = response.status === 409 || data?.code === "23505";

      return Response.json(
        {
          error: duplicate
            ? "That IATA code is already in use."
            : "Could not create airport.",
        },
        { status: duplicate ? 409 : 502 }
      );
    }

    return Response.json(
      { success: true, airport: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Airport create error:", error);
    return Response.json(
      { error: "Could not create airport." },
      { status: 500 }
    );
  }
}

// PATCH — Edit airport
export async function PATCH(request: Request) {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AirportInput & {
      id?: unknown;
    };

    const id = cleanText(body.id, 50);

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ) {
      return Response.json(
        { error: "Invalid airport ID." },
        { status: 400 }
      );
    }

    const validated = validateAirport(body, true);

    if ("error" in validated) {
      return Response.json(
        { error: validated.error },
        { status: 400 }
      );
    }

    if (Object.keys(validated.data).length === 0) {
      return Response.json(
        { error: "No changes were provided." },
        { status: 400 }
      );
    }

    const response = await supabaseRequest(
      `?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          ...validated.data,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Airport update error:", data);
      const duplicate = response.status === 409 || data?.code === "23505";

      return Response.json(
        {
          error: duplicate
            ? "That IATA code is already in use."
            : "Could not update airport.",
        },
        { status: duplicate ? 409 : 502 }
      );
    }

    if (!data?.length) {
      return Response.json(
        { error: "Airport not found." },
        { status: 404 }
      );
    }

    return Response.json({ success: true, airport: data[0] });
  } catch (error) {
    console.error("Airport update error:", error);
    return Response.json(
      { error: "Could not update airport." },
      { status: 500 }
    );
  }
}

// DELETE — Deactivate airport (not permanent deletion)
export async function DELETE(request: Request) {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = cleanText(body.id, 50);

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ) {
      return Response.json(
        { error: "Invalid airport ID." },
        { status: 400 }
      );
    }

    const response = await supabaseRequest(
      `?id=eq.${encodeURIComponent(id)}&select=id,iata_code`,
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
      console.error("Airport deactivate error:", data);
      return Response.json(
        { error: "Could not deactivate airport." },
        { status: 502 }
      );
    }

    if (!data?.length) {
      return Response.json(
        { error: "Airport not found." },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Airport deactivate error:", error);
    return Response.json(
      { error: "Could not deactivate airport." },
      { status: 500 }
    );
  }
}
