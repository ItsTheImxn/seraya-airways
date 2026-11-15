
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const secret = process.env.ROBLOX_CLIENT_SECRET;
  const cookieStore = await cookies();
  const value = cookieStore.get("seraya_roblox")?.value;

  if (!secret || !value) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  try {
    const separator = value.lastIndexOf(".");
    if (separator === -1) throw new Error("Invalid session");

    const payload = value.slice(0, separator);
    const signature = value.slice(separator + 1);

    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const actualBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new Error("Invalid signature");
    }

    const user = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      typeof user.id !== "string" ||
      !/^\d+$/.test(user.id) ||
      typeof user.username !== "string" ||
      typeof user.displayName !== "string"
    ) {
      throw new Error("Invalid profile");
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
