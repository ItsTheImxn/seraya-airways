
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export async function getAdminDiscordId(): Promise<string | null> {
  const secret = process.env.DISCORD_CLIENT_SECRET;

  const allowedIds = (process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!secret || allowedIds.length === 0) return null;

  const cookieStore = await cookies();
  const value = cookieStore.get("seraya_discord")?.value;

  if (!value) return null;

  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;

  const discordId = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  if (!/^\d{17,20}$/.test(discordId)) return null;

  const expected = createHmac("sha256", secret)
    .update(discordId)
    .digest("hex");

  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  return allowedIds.includes(discordId) ? discordId : null;
}
