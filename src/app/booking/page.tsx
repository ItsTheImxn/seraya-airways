
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function BookingContent() {
  const params = useSearchParams();

  const from = params.get("from") || "KUL";
  const to = params.get("to") || "BKI";
  const depart = params.get("depart") || "";
  const returnDate = params.get("return") || "";
  const trip = params.get("trip") || "One way";
  const passengers = params.get("passengers") || "1 Adult";
  const cabin = params.get("cabin") || "Economy";
  const flight = params.get("flight") || "SY 201";
  const aircraft = params.get("aircraft") || "Airbus A320neo";
  const departure = params.get("departure") || "08:30";
  const arrival = params.get("arrival") || "09:40";
  const fare = Number(params.get("fare")) || 189;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("Malaysian");
  const [reference, setReference] = useState("");

  function createBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const pnr = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    setReference(pnr);
  }

  if (reference) {
    return (
      <main style={{
        minHeight: "100vh",
        background: "#f8f6f1",
        padding: "50px 20px",
      }}>
        <div style={{
          maxWidth: "650px",
          margin: "auto",
          background: "white",
          padding: "35px",
          borderRadius: "12px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "45px" }}>✓</div>

          <p style={{ color: "#94703f" }}>
            SERAYA AIRWAYS
          </p>

          <h1 style={{
            fontFamily: "Georgia, serif",
            fontWeight: 400,
          }}>
            Booking created
          </h1>

          <p>Your demonstration booking has been created.</p>

          <div style={{
            background: "#f3eee5",
            padding: "25px",
            margin: "25px 0",
            borderRadius: "8px",
          }}>
            <small>BOOKING REFERENCE</small>
            <h1 style={{
              letterSpacing: "6px",
              fontSize: "32px",
              margin: "10px",
            }}>
              {reference}
            </h1>
          </div>

          <p><strong>{name}</strong></p>
          <p>{from} → {to}</p>
          <p>{flight} · {cabin}</p>
          <p>{depart}</p>

          <h2 style={{ marginTop: "20px" }}>
            RM {fare.toLocaleString("en-MY")}
          </h2>

          <p style={{ color: "#888", fontSize: "12px" }}>
            Demonstration only. This is not a real ticket or confirmed
            airline reservation.
          </p>

          <a href="/" style={{
            display: "inline-block",
            marginTop: "20px",
            background: "#98703e",
            color: "white",
            padding: "13px 25px",
            textDecoration: "none",
            borderRadius: "5px",
          }}>
            Return home
          </a>
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

        <nav>
          <a href="/">Home</a>
          <a href="/manage-booking">Manage booking</a>
        </nav>
      </header>

      <section style={{
        background: "#29251f",
        color: "white",
        padding: "45px 7%",
      }}>
        <div className="eyebrow" style={{ color: "#d6ad70" }}>
          COMPLETE YOUR JOURNEY
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          fontSize: "40px",
        }}>
          Passenger details
        </h1>

        <p>{from} → {to} · {flight}</p>
      </section>

      <div style={{
        maxWidth: "850px",
        margin: "auto",
        padding: "35px 20px",
      }}>
        <section style={{
          background: "white",
          borderRadius: "10px",
          padding: "25px",
          marginBottom: "20px",
        }}>
          <h2 style={{ fontFamily: "Georgia, serif" }}>
            Your flight
          </h2>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
            flexWrap: "wrap",
            gap: "15px",
          }}>
            <div>
              <h2>{departure}</h2>
              <strong>{from}</strong>
            </div>

            <div>
              <p>{flight}</p>
              <small>{aircraft}</small>
            </div>

            <div>
              <h2>{arrival}</h2>
              <strong>{to}</strong>
            </div>
          </div>

          <hr style={{ margin: "20px 0", borderColor: "#eee" }} />

          <p>Departure: {depart}</p>
          {trip === "Return" && <p>Return: {returnDate}</p>}
          <p>Passengers: {passengers}</p>
          <p>Cabin: {cabin}</p>
          <p style={{ marginTop: "12px" }}>
            <strong>Sample fare: RM {fare.toLocaleString("en-MY")}</strong>
          </p>
        </section>

        <form onSubmit={createBooking}>
          <section style={{
            background: "white",
            borderRadius: "10px",
            padding: "25px",
          }}>
            <h2 style={{ fontFamily: "Georgia, serif" }}>
              Passenger information
            </h2>

            <p style={{ color: "#777", margin: "10px 0 20px" }}>
              Enter demonstration details to create your booking.
              Do not use real personal information.
            </p>

            <label style={labelStyle}>
              FULL NAME
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Example Passenger"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              EMAIL ADDRESS
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="passenger@example.com"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              PHONE NUMBER
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+60 12 345 6789"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              NATIONALITY
              <select
                value={nationality}
                onChange={e => setNationality(e.target.value)}
                style={inputStyle}
              >
                <option>Malaysian</option>
                <option>Singaporean</option>
                <option>Indonesian</option>
                <option>Other</option>
              </select>
            </label>

            <button type="submit" style={{
              width: "100%",
              padding: "16px",
              background: "#98703e",
              color: "white",
              border: "none",
              borderRadius: "5px",
              marginTop: "20px",
              cursor: "pointer",
              fontWeight: "bold",
            }}>
              CREATE DEMONSTRATION BOOKING →
            </button>
          </section>
        </form>

        <p style={{
          textAlign: "center",
          color: "#888",
          fontSize: "12px",
          marginTop: "25px",
        }}>
          Seraya Airways · Fictional airline project
        </p>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginTop: "20px",
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "1px",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "13px",
  marginTop: "8px",
  border: "1px solid #ddd5c8",
  borderRadius: "5px",
  background: "white",
  fontSize: "15px",
};

export default function BookingPage() {
  return (
    <Suspense fallback={<p style={{ padding: 30 }}>Loading booking...</p>}>
      <BookingContent />
    </Suspense>
  );
}
