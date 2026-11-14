
import { getAdminDiscordId } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FONTS = [
  "DM Sans",
  "Inter",
  "Arial",
  "Helvetica",
  "Georgia",
  "Lato",
  "Montserrat",
  "Poppins",
  "Roboto",
  "Playfair Display",
];

const LOGO_FIELDS = [
  "primary_logo_url",
  "alternate_logo_url",
  "wordmark_url",
  "favicon_url",
] as const;

const COLOR_FIELDS = [
  "primary_color",
  "secondary_color",
  "accent_color",
  "background_color",
  "text_color",
] as const;

type BrandSettings = {
  primary_logo_url: string;
  alternate_logo_url: string;
  wordmark_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  heading_font: string;
  body_font: string;
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

async function supabaseRequest(path: string, init?: RequestInit) {
  const { url, key } = getConfig();

  return fetch(`${url}/rest/v1/${path}`, {
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

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function validate(body: Record<string, unknown>): BrandSettings | null {
  const { url } = getConfig();

  const settings = {
    primary_logo_url: clean(body.primary_logo_url),
    alternate_logo_url: clean(body.alternate_logo_url),
    wordmark_url: clean(body.wordmark_url),
    favicon_url: clean(body.favicon_url),

    primary_color: clean(body.primary_color),
    secondary_color: clean(body.secondary_color),
    accent_color: clean(body.accent_color),
    background_color: clean(body.background_color),
    text_color: clean(body.text_color),

    heading_font: clean(body.heading_font),
    body_font: clean(body.body_font),
  };

  const allowedMediaPrefix =
    `${url}/storage/v1/object/public/seraya-media/`;

  for (const field of LOGO_FIELDS) {
    const value = settings[field];

    if (
      value &&
      (!value.startsWith(allowedMediaPrefix) ||
        value.length > 2048)
    ) {
      return null;
    }
  }

  for (const field of COLOR_FIELDS) {
    if (!/^#[0-9a-fA-F]{6}$/.test(settings[field])) {
      return null;
    }
  }

  if (
    !FONTS.includes(settings.heading_font) ||
    !FONTS.includes(settings.body_font)
  ) {
    return null;
  }

  return settings;
}

export async function GET() {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const response = await supabaseRequest(
      "brand_settings?id=eq.default&select=*"
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Brand settings error:", data);
      return Response.json(
        { error: "Could not load brand settings." },
        { status: 502 }
      );
    }

    return Response.json({
      settings: data[0] || null,
    });
  } catch (error) {
    console.error("Brand settings error:", error);

    return Response.json(
      { error: "Brand settings service unavailable." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const settings = validate(body);

    if (!settings) {
      return Response.json(
        {
          error:
            "Invalid settings. Check your colours, fonts and uploaded image URLs.",
        },
        { status: 400 }
      );
    }

    const response = await supabaseRequest("brand_settings?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: "default",
        ...settings,
        updated_at: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Brand save error:", data);

      return Response.json(
        { error: "Could not save brand settings." },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      settings: data[0],
    });
  } catch (error) {
    console.error("Brand save error:", error);

    return Response.json(
      { error: "Could not save brand settings." },
      { status: 500 }
    );
  }
}
