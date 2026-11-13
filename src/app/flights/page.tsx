
"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const flights = [
  {
    number: "SY 201",
    aircraft: "Airbus A320neo",
    departure: "08:30",
    arrival: "09:40",
    duration: "1h 10m",
    price: 189,
  },
  {
    number: "SY 215",
    aircraft: "Boeing 737-800",
    departure: "11:45",
    arrival: "12:55",
    duration: "1h 10m",
    price: 219,
  },
  {
    number: "SY 309",
    aircraft: "Airbus A321neo",
    departure: "16:20",
    arrival: "17:30",
    duration: "1h 10m",
    price: 259,
  },
  {
    number: "SY 401",
    aircraft: "Airbus A320neo",
    departure: "20:10",
    arrival: "21:20",
    duration: "1h 10m",
    price: 199,
  },
];

function ResultsContent() {
  const params = useSearchParams();

  const from = params.get("from") || "Kuala Lumpur (KUL)";
  const to = params.get("to") || "Kota Kinabalu (BKI)";
  const depart = params.get("depart") || "";
  const returnDate = params.get("return") || "";
  const trip = params.get("trip") || "One way";
  const passengers = params.get("passengers") || "1 Adult";
  const cabin = params.get("cabin") || "Economy";

  const [sort, setSort] = useState("recommended");
  const [selected, setSelected] = useState("");

  const fromCode = from.match(/\((.*?)\)/)?.[1] || "KUL";
  const toCode = to.match(/\((.*?)\)/)?.[1] || "BKI";

  const sortedFlights = useMemo(() => {
    const list = [...flights];

    if (sort === "price") {
      list.sort((a, b) => a.price - b.price);
    }

    if (sort === "departure") {
      list.sort((a, b) =>
        a.departure.localeCompare(b.departure)
      );
    }

    return list;
  }, [sort]);

  const multiplier =
    cabin === "Business" ? 2.5 :
    cabin === "First Class" ? 4 : 1;

  function chooseFlight(number: string) {
    setSelected(number);
  }

  return (
    <main style={{ background: "#f8f6f1", minHeight: "100vh" }}>
      <header>
        <a href="/" className="brand">
          SERAYA
          <small>AIRWAYS</small>
        </a>

        <nav>
          <a href="/">Home</a>
          <a href="/manage-booking">Manage booking</a>
          <a href="/account">Sign in</a>
        </nav>
      </header>

      <section style={{
        background: "#29251f",
        color: "white",
        padding: "55px 7%",
      }}>
        <div className="eyebrow" style={{ color: "#d6ad70" }}>
          YOUR JOURNEY BEGINS
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 400,
          margin: "15px 0",
        }}>
          Available flights
        </h1>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "25px",
          alignItems: "center",
          marginTop: "25px",
        }}>
          <div>
            <small>FROM</small>
            <h2>{fromCode}</h2>
            <span>{from}</span>
          </div>

          <span style={{ fontSize: "25px" }}>→</span>

          <div>
            <small>TO</small>
            <h2>{toCode}</h2>
            <span>{to}</span>
          </div>

          <div>
            <small>DEPARTURE</small>
            <p>{depart || "Date not selected"}</p>
          </div>

          {trip === "Return" && (
            <div>
              <small>RETURN</small>
              <p>{returnDate || "Not selected"}</p>
            </div>
          )}
        </div>

        <p style={{ color: "#d7cfc3", marginTop: "20px" }}>
          {passengers} · {cabin} · {trip}
        </p>
      </section>

      <section style={{
        maxWidth: "1100px",
        margin: "auto",
        padding: "40px 20px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "25px",
        }}>
          <div>
            <h2 style={{
              fontFamily: "Georgia, serif",
              fontSize: "28px",
              fontWeight: 400,
            }}>
              Select your flight
            </h2>
            <p style={{ color: "#777" }}>
              {sortedFlights.length} sample flights available
            </p>
          </div>

          <label>
            Sort by{" "}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px" }}
            >
              <option value="recommended">Recommended</option>
              <option value="price">Lowest price</option>
              <option value="departure">Departure time</option>
            </select>
          </label>
        </div>

        {sortedFlights.map((flight) => {
          const fare = Math.round(flight.price * multiplier);

          return (
            <article
              key={flight.number}
              style={{
                background: "white",
                border: selected === flight.number
                  ? "2px solid #bd8b48"
                  : "1px solid #e7e0d5",
                borderRadius: "12px",
                padding: "25px",
                marginBottom: "16px",
                boxShadow: "0 3px 15px #00000008",
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "15px",
              }}>
                <div>
                  <strong>{flight.number}</strong>
                  <p style={{ color: "#777", marginTop: "5px" }}>
                    {flight.aircraft}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <small style={{ color: "#777" }}>
                    FROM
                  </small>
                  <h2 style={{
                    color: "#8a6535",
                    fontSize: "27px",
                  }}>
                    RM {fare.toLocaleString("en-MY")}
                  </h2>
                  <small>per passenger · sample fare</small>
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
                margin: "25px 0",
              }}>
                <div>
                  <h2 style={{ fontSize: "30px" }}>
                    {flight.departure}
                  </h2>
                  <strong>{fromCode}</strong>
                </div>

                <div style={{
                  flex: 1,
                  textAlign: "center",
                  color: "#888",
                  minWidth: "100px",
                }}>
                  <small>{flight.duration}</small>
                  <div style={{
                    borderTop: "1px solid #c9bda9",
                    margin: "8px 0",
                  }} />
                  <small>Non-stop</small>
                </div>

                <div style={{ textAlign: "right" }}>
                  <h2 style={{ fontSize: "30px" }}>
                    {flight.arrival}
                  </h2>
                  <strong>{toCode}</strong>
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}>
                <span style={{ color: "#777", fontSize: "13px" }}>
                  {cabin} · {passengers}
                </span>

                <button
                  onClick={() => chooseFlight(flight.number)}
                  style={{
                    background: selected === flight.number
                      ? "#47724d"
                      : "#9b713e",
                    color: "white",
                    border: "none",
                    padding: "13px 25px",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  {selected === flight.number
                    ? "Selected ✓"
                    : "Select flight"}
                </button>
              </div>
            </article>
          );
        })}

        {selected && (
          <div style={{
            background: "#eee8dc",
            borderRadius: "10px",
            padding: "20px",
            marginTop: "25px",
          }}>
            <strong>{selected} selected</strong>
            <p style={{ marginTop: "7px" }}>
              Your flight selection is saved on this page.
              The passenger and booking process will be added next.
            </p>
          </div>
        )}

        <p style={{
          textAlign: "center",
          color: "#888",
          fontSize: "12px",
          marginTop: "35px",
        }}>
          Seraya Airways is a fictional airline project.
          All schedules and fares shown are illustrative.
        </p>
      </section>

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

export default function FlightsPage() {
  return (
    <Suspense fallback={<p style={{ padding: 30 }}>Loading flights...</p>}>
      <ResultsContent />
    </Suspense>
  );
}
