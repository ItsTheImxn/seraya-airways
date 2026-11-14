
"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type SavedBooking = {
  pnr: string;
  passenger_name: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_date: string;
};

function PaymentContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [method, setMethod] = useState("Card");
  const [booking, setBooking] = useState<SavedBooking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const from = params.get("from") || "KUL";
  const to = params.get("to") || "BKI";
  const flight = params.get("flight") || "SY 201";
  const date = params.get("depart") || "";
  const name = params.get("name") || "Passenger";
  const email = params.get("email") || "";
  const seats = params.get("seats") || "";
  const total = Number(params.get("total") || 0);

  async function confirmPayment() {
    if (submitting || booking) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          flight,
          depart: date,
          name,
          email,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Booking could not be saved."
        );
      }

      setBooking(result.booking);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const card = {
    background: "white",
    padding: "25px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 3px 15px #00000008",
  };

  if (booking) {
    return (
      <main style={{
        minHeight: "100vh",
        background: "#f8f6f1",
        padding: "60px 20px",
        textAlign: "center",
      }}>
        <div style={{
          maxWidth: "550px",
          margin: "auto",
          ...card,
        }}>
          <h1 style={{ color: "#98703e" }}>
            Booking confirmed!
          </h1>

          <p>Your fictional Seraya Airways booking has been saved.</p>

          <hr style={{ margin: "25px 0" }} />

          <h2 style={{ letterSpacing: "3px" }}>
            {booking.pnr}
          </h2>

          <p>Booking reference (PNR)</p>

          <h3>
            {booking.origin} → {booking.destination}
          </h3>

          <p>
            {booking.flight_number} · {booking.departure_date}
          </p>

          <p>Passenger: {booking.passenger_name}</p>
          <p>Seats: {seats || "Not selected"}</p>

          <h2 style={{ color: "#98703e" }}>
            RM {total.toLocaleString("en-MY")}
          </h2>

          <p style={{ color: "#777", fontSize: "13px" }}>
            This is a fictional booking for Roblox roleplay.
            No real payment was made.
          </p>

          <p style={{ color: "#777", fontSize: "13px" }}>
  {booking.discord_notified
    ? "Your booking confirmation has been sent to your linked Discord account."
    : booking.discord_linked
      ? "Your booking is saved, but we couldn't deliver the Discord DM. Keep your PNR safe."
      : "Link your Discord account to receive booking confirmations by DM."}
</p>

          <button
            onClick={() => router.push("/")}
            style={{
              padding: "15px 25px",
              background: "#98703e",
              color: "white",
              border: "none",
              borderRadius: "5px",
              marginTop: "20px",
              cursor: "pointer",
            }}
          >
            RETURN HOME
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f8f6f1",
    }}>
      <header>
        <a href="/" className="brand">
          SERAYA
          <small>AIRWAYS</small>
        </a>
        <nav><a href="/">Home</a></nav>
      </header>

      <section style={{
        background: "#29251f",
        color: "white",
        padding: "45px 7%",
      }}>
        <p style={{ color: "#d6ad70" }}>
          SECURE CHECKOUT
        </p>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          fontSize: "40px",
        }}>
          Payment
        </h1>

        <p>Complete your Seraya Airways booking.</p>
      </section>

      <div style={{
        maxWidth: "750px",
        margin: "auto",
        padding: "35px 20px",
      }}>
        <section style={card}>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontWeight: 400,
          }}>
            Booking summary
          </h2>

          <h2 style={{ color: "#98703e" }}>
            {from} → {to}
          </h2>

          <p>{flight} · {date}</p>
          <p>Passenger: {name}</p>
          <p>Selected seats: {seats || "Not selected"}</p>

          <hr style={{ margin: "20px 0" }} />

          <div style={{
            display: "flex",
            justifyContent: "space-between",
          }}>
            <strong>Total amount</strong>

            <strong style={{
              color: "#98703e",
              fontSize: "22px",
            }}>
              RM {total.toLocaleString("en-MY")}
            </strong>
          </div>
        </section>

        <section style={card}>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontWeight: 400,
          }}>
            Select payment method
          </h2>

          {["Card", "Online Banking", "E-Wallet"].map(item => (
            <label key={item} style={{
              display: "block",
              padding: "17px",
              marginTop: "12px",
              border: method === item
                ? "2px solid #98703e"
                : "1px solid #ddd5c8",
              borderRadius: "7px",
              cursor: "pointer",
            }}>
              <input
                type="radio"
                name="method"
                checked={method === item}
                onChange={() => setMethod(item)}
              />{" "}
              {item}
            </label>
          ))}

          <p style={{
            color: "#777",
            fontSize: "13px",
            marginTop: "20px",
          }}>
            Demo checkout only. Do not enter real banking,
            card, password or payment information.
          </p>

          {error && (
            <p role="alert" style={{
              color: "#b33",
              marginTop: "15px",
            }}>
              {error}
            </p>
          )}

          <button
            onClick={confirmPayment}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "17px",
              background: submitting ? "#b9a487" : "#98703e",
              color: "white",
              border: "none",
              borderRadius: "5px",
              marginTop: "20px",
              cursor: submitting ? "wait" : "pointer",
              fontWeight: "bold",
            }}
          >
            {submitting
              ? "SAVING BOOKING..."
              : "CONFIRM DEMO PAYMENT"}
          </button>
        </section>
      </div>

      <footer>
        <a href="/" className="brand">
          SERAYA
          <small>AIRWAYS</small>
        </a>

        <div className="footer-bottom">
          © 2026 Seraya Airways · Fictional airline project
        </div>
      </footer>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<p style={{ padding: 30 }}>Loading payment...</p>}>
      <PaymentContent />
    </Suspense>
  );
}
