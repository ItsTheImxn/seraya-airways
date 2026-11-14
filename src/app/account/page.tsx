
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

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ discord?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();

  const discordCookie = cookieStore.get("seraya_discord")?.value;
  const secret = process.env.DISCORD_CLIENT_SECRET;

  const linked =
    !!discordCookie &&
    !!secret &&
    isValidDiscordCookie(discordCookie, secret);

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
            Discord Connection
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Connect your Discord account to receive booking
            confirmations and PNR details from Seri.
          </p>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                {linked ? "Discord connected" : "Not connected"}
              </p>
              <p className="text-sm text-gray-500">
                {linked
                  ? "Your Discord identity is linked in this browser."
                  : "Connect Discord to enable booking notifications."}
              </p>
            </div>

            <span className={linked ? "text-green-700" : "text-gray-500"}>
              {linked ? "Connected" : "Disconnected"}
            </span>
          </div>

          {!linked && (
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
