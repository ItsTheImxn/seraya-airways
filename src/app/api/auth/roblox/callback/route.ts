
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function signSession(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

export async function GET(request: Request) {
  const cookieStore = await cookies();

  const savedState = cookieStore.get("roblox_oauth_state")?.value;
  const verifier = cookieStore.get("roblox_oauth_verifier")?.value;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const redirect = (status: string) => {
    const response = NextResponse.redirect(
      new URL(`/account?roblox=${status}`, request.url)
    );

    response.cookies.delete("roblox_oauth_state");
    response.cookies.delete("roblox_oauth_verifier");

    return response;
  };

  if (
    oauthError ||
    !code ||
    !state ||
    !savedState ||
    !verifier ||
    state !== savedState
  ) {
    return redirect("error");
  }

  const clientId = process.env.ROBLOX_CLIENT_ID;
  const clientSecret = process.env.ROBLOX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirect("error");
  }

  try {
    const tokenResponse = await fetch(
      "https://apis.roblox.com/oauth/v1/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          code_verifier: verifier,
          client_id: clientId,
          client_secret: clientSecret,
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      console.error("Roblox token exchange failed:", tokenResponse.status);
      return redirect("error");
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return redirect("error");
    }

    const userResponse = await fetch(
      "https://apis.roblox.com/oauth/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      console.error("Roblox userinfo failed:", userResponse.status);
      return redirect("error");
    }

    const user = await userResponse.json();

    if (
      typeof user.sub !== "string" ||
      !/^\d+$/.test(user.sub) ||
      typeof user.preferred_username !== "string" ||
      typeof user.name !== "string"
    ) {
      return redirect("error");
    }

    const sessionData = {
      id: user.sub,
      username: user.preferred_username,
      displayName: user.name,
    };

    const payload = Buffer.from(
      JSON.stringify(sessionData)
    ).toString("base64url");

    const signature = signSession(payload, clientSecret);

    const response = NextResponse.redirect(
      new URL("/account?roblox=success", request.url)
    );

    response.cookies.delete("roblox_oauth_state");
    response.cookies.delete("roblox_oauth_verifier");

    response.cookies.set(
      "seraya_roblox",
      `${payload}.${signature}`,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return response;
  } catch (error) {
    console.error("Roblox callback error:", error);
    return redirect("error");
  }
}
