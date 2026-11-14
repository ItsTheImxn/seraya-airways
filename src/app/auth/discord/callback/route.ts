
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function signDiscordId(discordId: string, secret: string) {
  return createHmac("sha256", secret)
    .update(discordId)
    .digest("hex");
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("discord_oauth_state")?.value;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const redirect = (status: string) => {
    const response = NextResponse.redirect(
      new URL(`/account?discord=${status}`, request.url)
    );

    response.cookies.delete("discord_oauth_state");
    return response;
  };

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return redirect("error");
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri ||
    !supabaseUrl ||
    !supabaseKey
  ) {
    return redirect("error");
  }

  try {
    // Exchange the authorisation code for an access token.
    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      return redirect("error");
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return redirect("error");
    }

    // Retrieve the Discord user's identity.
    const userResponse = await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      return redirect("error");
    }

    const user = await userResponse.json();

    if (
      typeof user.id !== "string" ||
      typeof user.username !== "string"
    ) {
      return redirect("error");
    }

    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}`
      : null;

    // Save the linked Discord account in Supabase.
    const databaseResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/discord_links?on_conflict=discord_user_id`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          discord_user_id: user.id,
          discord_username: user.username,
          discord_avatar: avatar,
        }),
        cache: "no-store",
      }
    );

    if (!databaseResponse.ok) {
      console.error("Discord link database error:", await databaseResponse.text());
      return redirect("error");
    }

    // Create a signed, HttpOnly browser cookie.
    const signature = signDiscordId(user.id, clientSecret);

    const response = NextResponse.redirect(
      new URL("/account?discord=success", request.url)
    );

    response.cookies.delete("discord_oauth_state");

    response.cookies.set(
      "seraya_discord",
      `${user.id}.${signature}`,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    );

    return response;
  } catch (error) {
    console.error("Discord OAuth callback error:", error);
    return redirect("error");
  }
}
