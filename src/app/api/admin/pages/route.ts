import { getAdminDiscordId } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}

function validPageData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (!Array.isArray(data.sections) || data.sections.length > 100) {
    return false;
  }

  return JSON.stringify(value).length <= 500_000;
}

export async function GET() {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const response = await supabaseRequest(
      "site_pages?select=id,slug,title,page_data,is_published,created_at,updated_at&order=updated_at.desc"
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Pages load error:", data);
      return Response.json(
        { error: "Could not load website pages." },
        { status: 502 }
      );
    }

    return Response.json({ pages: data });
  } catch (error) {
    console.error("Pages load error:", error);

    return Response.json(
      { error: "Website pages service unavailable." },
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
    const title = clean(body.title);
    const slug = clean(body.slug).toLowerCase();

    if (!title || title.length > 100) {
      return Response.json(
        { error: "Enter a page title of up to 100 characters." },
        { status: 400 }
      );
    }

    if (!validSlug(slug)) {
      return Response.json(
        {
          error:
            "Use a valid URL slug with lowercase letters, numbers and hyphens.",
        },
        { status: 400 }
      );
    }

    const response = await supabaseRequest("site_pages", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        title,
        slug,
        page_data: { sections: [] },
        is_published: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === "23505") {
        return Response.json(
          { error: "A page with this URL slug already exists." },
          { status: 409 }
        );
      }

      console.error("Page creation error:", data);

      return Response.json(
        { error: "Could not create the page." },
        { status: 502 }
      );
    }

    return Response.json({ page: data[0] }, { status: 201 });
  } catch (error) {
    console.error("Page creation error:", error);

    return Response.json(
      { error: "Could not create the page." },
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

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({ error: "Invalid page ID." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) {
      const title = clean(body.title);

      if (!title || title.length > 100) {
        return Response.json(
          { error: "Page title must be between 1 and 100 characters." },
          { status: 400 }
        );
      }

      updates.title = title;
    }

    if (body.slug !== undefined) {
      const slug = clean(body.slug).toLowerCase();

      if (!validSlug(slug)) {
        return Response.json(
          { error: "Enter a valid page URL slug." },
          { status: 400 }
        );
      }

      updates.slug = slug;
    }

    if (body.page_data !== undefined) {
      if (!validPageData(body.page_data)) {
        return Response.json(
          { error: "The page content is invalid or too large." },
          { status: 400 }
        );
      }

      updates.page_data = body.page_data;
    }

    if (body.is_published !== undefined) {
      if (typeof body.is_published !== "boolean") {
        return Response.json(
          { error: "Invalid publishing status." },
          { status: 400 }
        );
      }

      updates.is_published = body.is_published;
    }

    const response = await supabaseRequest(
      `site_pages?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (data.code === "23505") {
        return Response.json(
          { error: "A page with this URL slug already exists." },
          { status: 409 }
        );
      }

      console.error("Page update error:", data);

      return Response.json(
        { error: "Could not update the page." },
        { status: 502 }
      );
    }

    if (!data.length) {
      return Response.json({ error: "Page not found." }, { status: 404 });
    }

    return Response.json({ page: data[0] });
  } catch (error) {
    console.error("Page update error:", error);

    return Response.json(
      { error: "Could not update the page." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = clean(body.id);

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({ error: "Invalid page ID." }, { status: 400 });
    }

    const response = await supabaseRequest(
      `site_pages?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          Prefer: "return=representation",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Page deletion error:", data);

      return Response.json(
        { error: "Could not delete the page." },
        { status: 502 }
      );
    }

    if (!data.length) {
      return Response.json({ error: "Page not found." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Page deletion error:", error);

    return Response.json(
      { error: "Could not delete the page." },
      { status: 500 }
    );
  }
}