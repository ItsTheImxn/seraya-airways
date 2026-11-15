
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.ROBLOX_CLIENT_ID;
  const redirectUri = process.env.ROBLOX_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Roblox login is not configured." },
      { status: 500 }
    );
  }

  const state = randomBytes(32).toString("hex");
  const verifier = randomBytes(32).toString("base64url");

  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");

  const cookieStore = await cookies();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };

  cookieStore.set("roblox_oauth_state", state, cookieOptions);
  cookieStore.set("roblox_oauth_verifier", verifier, cookieOptions);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return NextResponse.redirect(
    `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`
  );
}
