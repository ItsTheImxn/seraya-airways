
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

function isValidDiscordCookie(value: string, secret: string) {
  const separator = value.lastIndexOf(".");
  if (separator === -1) return false;

  const discordId = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  if (!/^\d+$/.test(discordId)) return false;

  const expected = createHmac("sha256", secret)
    .update(discordId)
    .digest("hex");

  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function getRobloxSession(value: string, secret: string) {
  try {
    const separator = value.lastIndexOf(".");
    if (separator === -1) return null;

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
      return null;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      typeof session.id !== "string" ||
      !/^\d+$/.test(session.id) ||
      typeof session.username !== "string" ||
      typeof session.displayName !== "string"
    ) {
      return null;
    }

    return session as {
      id: string;
      username: string;
      displayName: string;
    };
  } catch {
    return null;
  }
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    discord?: string;
    roblox?: string;
  }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();

  const discordCookie = cookieStore.get("seraya_discord")?.value;
  const discordSecret = process.env.DISCORD_CLIENT_SECRET;

  const discordLinked =
    !!discordCookie &&
    !!discordSecret &&
    isValidDiscordCookie(discordCookie, discordSecret);

  const robloxCookie = cookieStore.get("seraya_roblox")?.value;
  const robloxSecret = process.env.ROBLOX_CLIENT_SECRET;

  const robloxSession =
    robloxCookie && robloxSecret
      ? getRobloxSession(robloxCookie, robloxSecret)
      : null;

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-6 py-16 text-[#25251f]">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-sm text-gray-500">
          ← Back to Seraya
        </Link>

        <h1 className="mt-8 text-4xl font-semibold">
          My Account
        </h1>

        <p className="mt-3 text-gray-600">
          Manage your Seraya passenger account and connected services.
        </p>

        {params.roblox === "success" && (
          <p className="mt-6 rounded-lg bg-green-100 p-4 text-green-800">
            Your Roblox account has been successfully linked.
          </p>
        )}

        {params.roblox === "error" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-800">
            Roblox linking failed. Please try again.
          </p>
        )}

        {params.discord === "success" && (
          <p className="mt-6 rounded-lg bg-green-100 p-4 text-green-800">
            Your Discord account has been successfully linked.
          </p>
        )}

        {params.discord === "error" && (
          <p className="mt-6 rounded-lg bg-red-100 p-4 text-red-800">
            Discord linking failed. Please try again.
          </p>
        )}

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">
            Roblox Passenger Identity
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Link your Roblox account to use your verified Roblox identity
            when booking flights with Seraya.
          </p>

          {robloxSession ? (
            <div className="mt-5 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Display name</p>
                <p className="font-medium">{robloxSession.displayName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Roblox username</p>
                <p className="font-medium">@{robloxSession.username}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Roblox User ID</p>
                <p className="font-medium">{robloxSession.id}</p>
              </div>

              <p className="pt-2 text-sm font-medium text-green-700">
                Roblox account connected
              </p>
            </div>
          ) : (
            <>
              <p className="mt-5 text-sm text-gray-500">
                No Roblox account is currently connected.
              </p>

              <a
                href="/api/auth/roblox"
                className="mt-6 inline-block rounded-lg bg-[#25251f] px-5 py-3 text-sm font-medium text-white"
              >
                Connect Roblox
              </a>
            </>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">
            Discord Connection
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Connect your Discord account to receive booking
            confirmations and PNR details from Seri.
          </p>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {discordLinked ? "Discord connected" : "Not connected"}
              </p>
              <p className="text-sm text-gray-500">
                {discordLinked
                  ? "Your Discord identity is linked in this browser."
                  : "Connect Discord to enable booking notifications."}
              </p>
            </div>

            <span className={discordLinked ? "text-green-700" : "text-gray-500"}>
              {discordLinked ? "Connected" : "Disconnected"}
            </span>
          </div>

          {!discordLinked && (
            <a
              href="/api/auth/discord"
              className="mt-6 inline-block rounded-lg bg-[#25251f] px-5 py-3 text-sm font-medium text-white"
            >
              Link Discord
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
