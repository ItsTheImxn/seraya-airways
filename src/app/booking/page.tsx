
"use client";

import { useState, type FormEvent } from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const occupiedSeats = ["1B", "2C", "3D", "4A", "5B", "6C"];

function BookingContent() {
  const params = useSearchParams();
  const router = useRouter();

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

  const passengerCount = passengers.includes("2 Adults, 1 Child")
    ? 3
    : Number(passengers.match(/\d+/)?.[0] || 1);

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [baggage, setBaggage] = useState("20");
  const [meal, setMeal] = useState("Standard meal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const baggagePrice =
    baggage === "20" ? 55 :
    baggage === "30" ? 85 : 0;

  const mealPrice = meal === "Premium meal" ? 25 : 0;

  const seatPrice = selectedSeats.filter(
    seat => Number(seat[0]) <= 2
  ).length * 45;

  const journeyMultiplier = trip === "Return" ? 2 : 1;

  const baseTotal = fare * passengerCount * journeyMultiplier;

  const extrasTotal =
    (baggagePrice + mealPrice) * passengerCount + seatPrice;

  const total = baseTotal + extrasTotal;

  function toggleSeat(seat: string) {
    if (occupiedSeats.includes(seat)) return;

    setError("");

    setSelectedSeats(current => {
      if (current.includes(seat)) {
        return current.filter(item => item !== seat);
      }

      if (current.length >= passengerCount) {
        setError(`You can only select ${passengerCount} seats.`);
        return current;
      }

      return [...current, seat];
    });
  }

  function createBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (selectedSeats.length !== passengerCount) {
      setError(`Please select ${passengerCount} seats.`);
      return;
    }

    setError("");

    const paymentDetails = new URLSearchParams({
      from,
      to,
      depart,
      return: returnDate,
      trip,
      passengers,
      cabin,
      flight,
      aircraft,
      departure,
      arrival,
      fare: String(fare),
      name,
      email,
      phone,
      seats: selectedSeats.join(","),
      baggage,
      meal,
      total: String(total),
    });

    router.push(`/payment?${paymentDetails.toString()}`);
  }

  const labelStyle = {
    display: "block",
    marginTop: "18px",
    fontSize: "12px",
    fontWeight: "bold" as const,
    letterSpacing: "1px",
  };

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: "13px",
    marginTop: "8px",
    border: "1px solid #ddd5c8",
    borderRadius: "5px",
    background: "white",
    fontSize: "15px",
  };

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
          YOUR JOURNEY
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontWeight: 400,
          fontSize: "40px",
        }}>
          Complete your booking
        </h1>

        <p>{from} → {to} · {flight}</p>
      </section>

      <div style={{
        maxWidth: "900px",
        margin: "auto",
        padding: "35px 20px",
      }}>
        <section style={cardStyle}>
          <h2 style={headingStyle}>Your flight</h2>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "15px",
            marginTop: "20px",
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
        </section>

        <section style={cardStyle}>
          <h2 style={headingStyle}>01 · Select your seats</h2>

          <p style={{ color: "#777", margin: "10px 0 20px" }}>
            Select {passengerCount} seat(s). Rows 1–2 have an
            additional RM45 seat charge each.
          </p>

          <div style={{
            maxWidth: "340px",
            margin: "auto",
            border: "1px solid #e5ded2",
            borderRadius: "100px 100px 15px 15px",
            padding: "25px 15px",
          }}>
            <p style={{
              textAlign: "center",
              color: "#98703e",
              marginBottom: "25px",
              letterSpacing: "2px",
              fontSize: "12px",
            }}>
              FRONT OF AIRCRAFT
            </p>

            {Array.from({ length: 8 }, (_, index) => {
              const row = index + 1;

              return (
                <div key={row} style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "9px",
                }}>
                  {["A", "B", "C", "D"].map(letter => {
                    const seat = `${row}${letter}`;
                    const occupied = occupiedSeats.includes(seat);
                    const selected = selectedSeats.includes(seat);

                    return (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => toggleSeat(seat)}
                        disabled={occupied}
                        style={{
                          width: "47px",
                          height: "40px",
                          borderRadius: "7px",
                          border: "1px solid #ddd",
                          background: occupied
                            ? "#d7d3cc"
                            : selected
                            ? "#98703e"
                            : "white",
                          color: selected ? "white" : "#333",
                          cursor: occupied ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {seat}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginTop: "20px",
            fontSize: "12px",
          }}>
            <span>□ Available</span>
            <span>■ Occupied</span>
            <span style={{ color: "#98703e" }}>■ Selected</span>
          </div>

          <p style={{ marginTop: "18px" }}>
            Selected: {selectedSeats.length}/{passengerCount}
            {selectedSeats.length > 0 && ` · ${selectedSeats.join(", ")}`}
          </p>
        </section>

        <section style={cardStyle}>
          <h2 style={headingStyle}>02 · Baggage allowance</h2>

          <p style={{ color: "#777", margin: "10px 0 20px" }}>
            Choose a checked baggage package per passenger.
          </p>

          {[
            { value: "0", title: "Cabin baggage only", price: "Included" },
            { value: "20", title: "20 kg checked baggage", price: "RM55" },
            { value: "30", title: "30 kg checked baggage", price: "RM85" },
          ].map(option => (
            <label key={option.value} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px",
              border: baggage === option.value
                ? "2px solid #98703e"
                : "1px solid #e5ded2",
              borderRadius: "7px",
              marginTop: "10px",
              cursor: "pointer",
              gap: "10px",
            }}>
              <span>
                <input
                  type="radio"
                  name="baggage"
                  value={option.value}
                  checked={baggage === option.value}
                  onChange={e => setBaggage(e.target.value)}
                />{" "}
                {option.title}
              </span>
              <strong>{option.price}</strong>
            </label>
          ))}
        </section>

        <section style={cardStyle}>
          <h2 style={headingStyle}>03 · In-flight dining</h2>

          <p style={{ color: "#777", margin: "10px 0 20px" }}>
            Choose your preferred meal per passenger.
          </p>

          <label style={labelStyle}>
            MEAL SELECTION
            <select
              value={meal}
              onChange={e => setMeal(e.target.value)}
              style={inputStyle}
            >
              <option>Standard meal</option>
              <option>Premium meal</option>
              <option>No meal</option>
            </select>
          </label>

          <p style={{ color: "#777", fontSize: "13px", marginTop: "10px" }}>
            Standard meal: Included · Premium meal: RM25 per passenger
            · No meal: Included
          </p>
        </section>

        <form onSubmit={createBooking}>
          <section style={cardStyle}>
            <h2 style={headingStyle}>04 · Passenger information</h2>

            <p style={{ color: "#777", marginTop: "10px" }}>
              Use fictional details for this Roblox roleplay demonstration.
            </p>

            <label style={labelStyle}>
              PASSENGER NAME
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
          </section>

          <section style={cardStyle}>
            <h2 style={headingStyle}>05 · Fare summary</h2>

            <div style={summaryRow}>
              <span>Flight fare × {passengerCount} × {journeyMultiplier}</span>
              <strong>RM {baseTotal.toLocaleString("en-MY")}</strong>
            </div>

            <div style={summaryRow}>
              <span>Checked baggage</span>
              <strong>RM {(baggagePrice * passengerCount).toLocaleString("en-MY")}</strong>
            </div>

            <div style={summaryRow}>
              <span>Meals</span>
              <strong>RM {(mealPrice * passengerCount).toLocaleString("en-MY")}</strong>
            </div>

            <div style={summaryRow}>
              <span>Seat selection</span>
              <strong>RM {seatPrice.toLocaleString("en-MY")}</strong>
            </div>

            <hr style={{ margin: "20px 0", borderColor: "#eee" }} />

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <strong>TOTAL</strong>
              <h2 style={{ color: "#98703e" }}>
                RM {total.toLocaleString("en-MY")}
              </h2>
            </div>

            {error && (
              <p style={{ color: "#b33", marginTop: "15px" }}>
                {error}
              </p>
            )}

            <button type="submit" style={{
              width: "100%",
              padding: "17px",
              background: "#98703e",
              color: "white",
              border: "none",
              borderRadius: "5px",
              marginTop: "25px",
              cursor: "pointer",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}>
              CONTINUE TO PAYMENT →
            </button>

            <p style={{
              textAlign: "center",
              color: "#888",
              fontSize: "11px",
              marginTop: "15px",
            }}>
              No real payment will be collected.
            </p>
          </section>
        </form>
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

const cardStyle = {
  background: "white",
  borderRadius: "10px",
  padding: "25px",
  marginBottom: "20px",
  boxShadow: "0 3px 15px #00000008",
};

const headingStyle = {
  fontFamily: "Georgia, serif",
  fontWeight: 400 as const,
  fontSize: "24px",
};

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginTop: "16px",
  fontSize: "14px",
};

export default function BookingPage() {
  return (
    <Suspense fallback={<p style={{ padding: 30 }}>Loading booking...</p>}>
      <BookingContent />
    </Suspense>
  );
}
