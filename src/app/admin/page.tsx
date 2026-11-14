
import { redirect } from "next/navigation";
import { getAdminDiscordId } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCount(url: string, key: string, filter = "") {
  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/bookings?select=id${filter}`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "count=exact",
          Range: "0-0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return "—";

    const range = response.headers.get("content-range");
    const match = range?.match(/\/(\d+)$/);

    return match
      ? Number(match[1]).toLocaleString("en-MY")
      : "0";
  } catch {
    return "—";
  }
}

const panelStyle = {
  background: "#fff",
  border: "1px solid #e9e3d9",
  borderRadius: "14px",
  padding: "22px",
};

export default async function AdminPage() {
  const adminId = await getAdminDiscordId();

  if (!adminId) {
    redirect("/account?admin=unauthorized");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let totalBookings = "—";
  let discordSent = "—";

  if (supabaseUrl && supabaseKey) {
    [totalBookings, discordSent] = await Promise.all([
      getCount(supabaseUrl, supabaseKey),
      getCount(supabaseUrl, supabaseKey, "&discord_notified=eq.true"),
    ]);
  }

  const sections = [
    {
      title: "Flight management",
      description: "Create routes, schedule flights, assign aircraft and manage fares.",
      symbol: "✈",
    },
    {
      title: "Website designer",
      description: "Edit pages, layouts, colours, typography, navigation and content.",
      symbol: "◇",
    },
    {
      title: "Bookings",
      description: "Search PNRs, review passenger details and manage booking status.",
      symbol: "▤",
    },
    {
      title: "Staff & permissions",
      description: "Control who can access each area of the management portal.",
      symbol: "♙",
    },
    {
      title: "Media library",
      description: "Organise banners, destination photography and brand assets.",
      symbol: "▧",
    },
    {
      title: "Activity logs",
      description: "Review administrative changes and publishing history.",
      symbol: "◷",
    },
  ];

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f7f5f0",
      color: "#29251f",
      fontFamily: "Arial, sans-serif",
    }}>
      <header style={{
        minHeight: "76px",
        padding: "0 5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#29251f",
        color: "#fff",
      }}>
        <a href="/" style={{
          color: "#fff",
          textDecoration: "none",
          fontFamily: "Georgia, serif",
          letterSpacing: "3px",
          fontSize: "20px",
        }}>
          SERAYA <span style={{ color: "#d6ad70" }}>ADMIN</span>
        </a>

        <a href="/" style={{
          color: "#e5d6bf",
          textDecoration: "none",
          fontSize: "13px",
        }}>
          View website ↗
        </a>
      </header>

      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "42px 22px 70px",
      }}>
        <div style={{ marginBottom: "30px" }}>
          <p style={{
            color: "#98703e",
            letterSpacing: "2px",
            fontSize: "11px",
            fontWeight: 700,
          }}>
            SERAYA AIRWAYS · MANAGEMENT
          </p>

          <h1 style={{
            fontFamily: "Georgia, serif",
            fontWeight: 400,
            fontSize: "36px",
            margin: "8px 0",
          }}>
            Admin dashboard
          </h1>

          <p style={{ color: "#777", margin: 0 }}>
            Manage your airline, bookings and website from one place.
          </p>
        </div>

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
          marginBottom: "30px",
        }}>
          <div style={panelStyle}>
            <p style={{ color: "#777", fontSize: "13px", margin: 0 }}>
              Total bookings
            </p>
            <h2 style={{
              fontSize: "32px",
              margin: "12px 0 0",
              color: "#98703e",
            }}>
              {totalBookings}
            </h2>
          </div>

          <div style={panelStyle}>
            <p style={{ color: "#777", fontSize: "13px", margin: 0 }}>
              Discord confirmations sent
            </p>
            <h2 style={{
              fontSize: "32px",
              margin: "12px 0 0",
              color: "#98703e",
            }}>
              {discordSent}
            </h2>
          </div>

          <div style={panelStyle}>
            <p style={{ color: "#777", fontSize: "13px", margin: 0 }}>
              Admin access
            </p>
            <h2 style={{
              fontSize: "20px",
              margin: "16px 0 0",
              color: "#477653",
            }}>
              Verified
            </h2>
          </div>
        </section>

        <h2 style={{
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          fontSize: "24px",
          marginBottom: "16px",
        }}>
          Management
        </h2>

        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
          gap: "16px",
        }}>
          {sections.map((item) => (
            <div key={item.title} style={panelStyle}>
              <div style={{
                width: "42px",
                height: "42px",
                display: "grid",
                placeItems: "center",
                borderRadius: "10px",
                background: "#f5efe5",
                color: "#98703e",
                fontSize: "22px",
                marginBottom: "18px",
              }}>
                {item.symbol}
              </div>

              <h3 style={{ margin: "0 0 8px", fontSize: "17px" }}>
                {item.title}
              </h3>

              <p style={{
                color: "#777",
                fontSize: "13px",
                lineHeight: 1.6,
                minHeight: "42px",
              }}>
                {item.description}
              </p>

              <span style={{
                display: "inline-block",
                color: "#98703e",
                background: "#f7f1e7",
                borderRadius: "20px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 700,
              }}>
                Coming next
              </span>
            </div>
          ))}
        </section>

        <p style={{
          color: "#999",
          fontSize: "12px",
          marginTop: "32px",
          textAlign: "center",
        }}>
          Seraya Airways · Internal management portal
        </p>
      </div>
    </main>
  );
}
