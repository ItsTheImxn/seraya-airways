
import {
  randomInt,
  createHmac,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function makePnr() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "SY";

  for (let i = 0; i < 6; i++) {
    value += alphabet[randomInt(alphabet.length)];
  }

  return value;
}

function getRobloxSession(
  cookieValue: string | undefined,
  secret: string | undefined
) {
  if (!cookieValue || !secret) return null;

  try {
    const separator = cookieValue.lastIndexOf(".");
    if (separator === -1) return null;

    const payload = cookieValue.slice(0, separator);
    const signature = cookieValue.slice(separator + 1);

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

    return {
      id: session.id,
      username: session.username,
      displayName: session.displayName,
    };
  } catch {
    return null;
  }
}

function getLinkedDiscordId(
  cookieValue: string | undefined,
  secret: string | undefined
): string | null {
  if (!cookieValue || !secret) return null;

  const separator = cookieValue.lastIndexOf(".");
  if (separator === -1) return null;

  const discordId = cookieValue.slice(0, separator);
  const signature = cookieValue.slice(separator + 1);

  if (!/^\d+$/.test(discordId)) return null;

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

  return discordId;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const discordSecret = process.env.DISCORD_CLIENT_SECRET;
    const robloxSecret = process.env.ROBLOX_CLIENT_SECRET;
    const seriWebhookUrl = process.env.SERI_WEBHOOK_URL;
    const bookingApiSecret = process.env.BOOKING_API_SECRET;

    if (!supabaseUrl || !supabaseKey || !robloxSecret) {
      return Response.json(
        { error: "Booking service is not configured." },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    const roblox = getRobloxSession(
      cookieStore.get("seraya_roblox")?.value,
      robloxSecret
    );

    if (!roblox) {
      return Response.json(
        { error: "Please connect your Roblox account before booking." },
        { status: 401 }
      );
    }

    const discordUserId = getLinkedDiscordId(
      cookieStore.get("seraya_discord")?.value,
      discordSecret
    );

    const body = await request.json();

    const flight = String(body.flight || "").trim();
    const from = String(body.from || "").trim().toUpperCase();
    const to = String(body.to || "").trim().toUpperCase();
    const depart = String(body.depart || "").trim();
    const flightId = String(body.flightId || "").trim();

    if (
      !flight ||
      !from ||
      !to ||
      from === to ||
      !/^\d{4}-\d{2}-\d{2}$/.test(depart) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(flightId)
    ) {
      return Response.json(
        { error: "Some booking details are invalid." },
        { status: 400 }
      );
    }

    const baseUrl = supabaseUrl.replace(/\/$/, "");
    const flightResponse = await fetch(
  `${baseUrl}/rest/v1/flights?id=eq.${encodeURIComponent(flightId)}&select=id,flight_number,origin_code,destination_code,departure_date,is_active`,
  {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    cache: "no-store",
  }
);

if (!flightResponse.ok) {
  console.error("Flight lookup failed:", await flightResponse.text());
  return Response.json(
    { error: "We couldn't verify this flight. Please try again." },
    { status: 502 }
  );
}

const flightRows = await flightResponse.json();
const scheduledFlight = flightRows[0];

if (
  !scheduledFlight ||
  !scheduledFlight.is_active ||
  scheduledFlight.flight_number !== flight ||
  scheduledFlight.origin_code !== from ||
  scheduledFlight.destination_code !== to ||
  scheduledFlight.departure_date !== depart
) {
  return Response.json(
    { error: "This scheduled flight is no longer available. Please search again." },
    { status: 400 }
  );
}

    for (let attempt = 0; attempt < 3; attempt++) {
      const pnr = makePnr();

      const response = await fetch(
        `${baseUrl}/rest/v1/bookings`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            pnr,
            passenger_name: roblox.displayName,
            passenger_email: null,
            roblox_user_id: roblox.id,
            roblox_username: roblox.username,
            roblox_display_name: roblox.displayName,
            discord_user_id: discordUserId,
            flight_id: scheduledFlight.id,
            flight_number: scheduledFlight.flight_number,
            origin: scheduledFlight.origin_code,
            destination: scheduledFlight.destination_code,
            departure_date: scheduledFlight.departure_date,
            booking_status: "confirmed",
          }),
          cache: "no-store",
        }
      );

      if (response.ok) {
        const rows = await response.json();
        const booking = rows[0];

        let discordNotified = false;

        if (
          booking.discord_user_id &&
          seriWebhookUrl &&
          bookingApiSecret
        ) {
          try {
            const webhookResponse = await fetch(
              `${seriWebhookUrl.replace(/\/$/, "")}/webhook/booking`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${bookingApiSecret}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  pnr: booking.pnr,
                  discord_user_id: booking.discord_user_id,
                  passenger_name: booking.passenger_name,
                  flight_number: booking.flight_number,
                  origin: booking.origin,
                  destination: booking.destination,
                  departure_date: booking.departure_date,
                }),
                signal: AbortSignal.timeout(8000),
                cache: "no-store",
              }
            );

            if (webhookResponse.ok) {
              discordNotified = true;

              const updateResponse = await fetch(
                `${baseUrl}/rest/v1/bookings?pnr=eq.${encodeURIComponent(booking.pnr)}`,
                {
                  method: "PATCH",
                  headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                    Prefer: "return=minimal",
                  },
                  body: JSON.stringify({
                    discord_notified: true,
                  }),
                  cache: "no-store",
                }
              );

              if (!updateResponse.ok) {
                console.error(
                  "Could not update Discord notification status:",
                  await updateResponse.text()
                );
              }
            } else {
              console.error(
                "Seri webhook returned:",
                webhookResponse.status,
                await webhookResponse.text()
              );
            }
          } catch (error) {
            console.error("Seri notification failed:", error);
          }
        }

        return Response.json({
          success: true,
          booking: {
            pnr: booking.pnr,
            passenger_name: booking.passenger_name,
            roblox_user_id: booking.roblox_user_id,
            roblox_username: booking.roblox_username,
            roblox_display_name: booking.roblox_display_name,
            flight_number: booking.flight_number,
            origin: booking.origin,
            destination: booking.destination,
            departure_date: booking.departure_date,
            discord_linked: Boolean(booking.discord_user_id),
            discord_notified: discordNotified,
          },
        });
      }

      if (response.status !== 409) {
        console.error("Supabase error:", await response.text());

        return Response.json(
          { error: "We couldn't save your booking. Please try again." },
          { status: 502 }
        );
      }
    }

    return Response.json(
      { error: "Please try again." },
      { status: 503 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Unable to complete booking." },
      { status: 500 }
    );
  }
}
