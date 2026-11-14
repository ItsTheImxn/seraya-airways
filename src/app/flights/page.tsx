
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Flight = {
  id: string;
  flight_number: string;
  origin_code: string;
  destination_code: string;
  origin_name: string;
  destination_name: string;
  aircraft: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  base_fare: number;
};

function formatTime(value: string) {
  return value.slice(0, 5);
}

function ResultsContent() {
  const params = useSearchParams();

  const from = params.get("from") || "Kuala Lumpur (KUL)";
  const to = params.get("to") || "Kota Kinabalu (BKI)";
  const depart = params.get("depart") || "";
  const returnDate = params.get("return") || "";
  const trip = params.get("trip") || "One way";
  const passengers = params.get("passengers") || "1 Adult";
  const cabin = params.get("cabin") || "Economy";

  const [flights, setFlights] = useState<Flight[]>([]);
  const [sort, setSort] = useState("recommended");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fromCode = from.match(/\((.*?)\)/)?.[1] || "KUL";
  const toCode = to.match(/\((.*?)\)/)?.[1] || "BKI";

  useEffect(() => {
    let cancelled = false;

    async function loadFlights() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/flights", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Could not load available flights."
          );
        }

        if (!cancelled) {
          setFlights(data.flights || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFlights();

    return () => {
      cancelled = true;
    };
  }, []);

  const routeFlights = useMemo(() => {
    return flights.filter(
      (flight) =>
        flight.origin_code.toUpperCase() === fromCode.toUpperCase() &&
        flight.destination_code.toUpperCase() === toCode.toUpperCase()
    );
  }, [flights, fromCode, toCode]);

  const sortedFlights = useMemo(() => {
    const list = [...routeFlights];

    if (sort === "price") {
      list.sort(
        (a, b) => Number(a.base_fare) - Number(b.base_fare)
      );
    }

    if (sort === "departure") {
      list.sort((a, b) =>
        a.departure_time.localeCompare(b.departure_time)
      );
    }

    return list;
  }, [routeFlights, sort]);

  const multiplier =
    cabin === "Business" ? 2.5 :
    cabin === "First Class" ? 4 : 1;

  function chooseFlight(flight: Flight) {
    setSelected(flight.flight_number);

    const fare = Math.round(
      Number(flight.base_fare) * multiplier
    );

    const bookingParams = new URLSearchParams({
      from,
      to,
      depart,
      return: returnDate,
      trip,
      passengers,
      cabin,
      flight: flight.flight_number,
      aircraft: flight.aircraft,
      departure: formatTime(flight.departure_time),
      arrival: formatTime(flight.arrival_time),
      fare: String(fare),
    });

    window.location.href = `/booking?${bookingParams.toString()}`;
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

      <section
        style={{
          background: "#29251f",
          color: "white",
          padding: "55px 7%",
        }}
      >
        <div className="eyebrow" style={{ color: "#d6ad70" }}>
          YOUR JOURNEY BEGINS
        </div>

        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 400,
            margin: "15px 0",
          }}
        >
          Available flights
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "25px",
            alignItems: "center",
            marginTop: "25px",
          }}
        >
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

      <section
        style={{
          maxWidth: "1100px",
          margin: "auto",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "28px",
                fontWeight: 400,
              }}
            >
              Select your flight
            </h2>

            <p style={{ color: "#777" }}>
              {loading
                ? "Checking available flights..."
                : `${sortedFlights.length} flights available`}
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

        {loading && (
          <div
            style={{
              background: "white",
              padding: "45px 20px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#777",
            }}
          >
            Loading available flights...
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              background: "#fff0ed",
              border: "1px solid #e8c5bd",
              padding: "25px",
              borderRadius: "12px",
              color: "#9b3c2e",
            }}
          >
            <strong>Unable to load flights</strong>
            <p style={{ marginTop: "8px" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "15px",
                padding: "10px 18px",
                background: "#9b713e",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && sortedFlights.length === 0 && (
          <div
            style={{
              background: "white",
              border: "1px solid #e7e0d5",
              borderRadius: "12px",
              padding: "45px 20px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "24px",
                fontWeight: 400,
              }}
            >
              No flights found
            </h3>

            <p style={{ color: "#777", marginTop: "10px" }}>
              There are currently no active flights from {fromCode} to{" "}
              {toCode}.
            </p>

            <a
              href="/"
              style={{
                display: "inline-block",
                marginTop: "20px",
                color: "#98703e",
                textDecoration: "underline",
              }}
            >
              Search another route
            </a>
          </div>
        )}

        {!loading &&
          !error &&
          sortedFlights.map((flight) => {
            const fare = Math.round(
              Number(flight.base_fare) * multiplier
            );

            return (
              <article
                key={flight.id}
                style={{
                  background: "white",
                  border:
                    selected === flight.flight_number
                      ? "2px solid #bd8b48"
                      : "1px solid #e7e0d5",
                  borderRadius: "12px",
                  padding: "25px",
                  marginBottom: "16px",
                  boxShadow: "0 3px 15px #00000008",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "15px",
                  }}
                >
                  <div>
                    <strong>{flight.flight_number}</strong>
                    <p style={{ color: "#777", marginTop: "5px" }}>
                      {flight.aircraft}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <small style={{ color: "#777" }}>FROM</small>
                    <h2
                      style={{
                        color: "#8a6535",
                        fontSize: "27px",
                      }}
                    >
                      RM {fare.toLocaleString("en-MY")}
                    </h2>
                    <small>per passenger</small>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                    margin: "25px 0",
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: "30px" }}>
                      {formatTime(flight.departure_time)}
                    </h2>
                    <strong>{flight.origin_code}</strong>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      textAlign: "center",
                      color: "#888",
                      minWidth: "100px",
                    }}
                  >
                    <small>{flight.duration}</small>
                    <div
                      style={{
                        borderTop: "1px solid #c9bda9",
                        margin: "8px 0",
                      }}
                    />
                    <small>Non-stop</small>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <h2 style={{ fontSize: "30px" }}>
                      {formatTime(flight.arrival_time)}
                    </h2>
                    <strong>{flight.destination_code}</strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <span style={{ color: "#777", fontSize: "13px" }}>
                    {cabin} · {passengers}
                  </span>

                  <button
                    onClick={() => chooseFlight(flight)}
                    style={{
                      background: "#9b713e",
                      color: "white",
                      border: "none",
                      padding: "13px 25px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Select flight
                  </button>
                </div>
              </article>
            );
          })}

        <p
          style={{
            textAlign: "center",
            color: "#888",
            fontSize: "12px",
            marginTop: "35px",
          }}
        >
          Seraya Airways is a fictional airline project.
          All schedules and fares are illustrative.
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
    <Suspense
      fallback={<p style={{ padding: 30 }}>Loading flights...</p>}
    >
      <ResultsContent />
    </Suspense>
  );
}
