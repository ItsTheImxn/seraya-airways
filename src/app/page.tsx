
"use client";

import { useEffect, useState } from "react";

type BrandLogos = {
  primary_logo_url: string | null;
  alternate_logo_url: string | null;
  wordmark_url: string | null;
};

type Airport = {
  id: string;
  iata_code: string;
  airport_name: string;
  city: string;
  country: string;
};

function airportLabel(airport: Airport) {
  return `${airport.city} (${airport.iata_code})`;
}

function AirportPicker({
  label,
  airports,
  selected,
  onSelect,
  excludedCode,
}: {
  label: string;
  airports: Airport[];
  selected: Airport | null;
  onSelect: (airport: Airport | null) => void;
  excludedCode?: string;
}) {
  const [query, setQuery] = useState(
    selected ? airportLabel(selected) : ""
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(selected ? airportLabel(selected) : "");
  }, [selected]);

  const filtered = airports.filter((airport) => {
    if (airport.iata_code === excludedCode) return false;

    const searchText = [
      airport.iata_code,
      airport.airport_name,
      airport.city,
      airport.country,
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(query.trim().toLowerCase());
  });

  return (
    <div className="field airport-picker">
      <span>{label}</span>

      <input
        type="text"
        value={query}
        placeholder="Search city, airport or code"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          onSelect(null);
          setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
      />

      {open && (
        <div className="airport-results">
          {filtered.length > 0 ? (
            filtered.slice(0, 8).map((airport) => (
              <button
                type="button"
                key={airport.id}
                className="airport-result"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(airport);
                  setQuery(airportLabel(airport));
                  setOpen(false);
                }}
              >
                <span className="airport-result-code">
                  {airport.iata_code}
                </span>

                <span className="airport-result-details">
                  <strong>{airport.airport_name}</strong>
                  <small>
                    {airport.city}, {airport.country}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <div className="airport-empty">
              No matching airports found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [trip, setTrip] = useState("Return");
  const [from, setFrom] = useState<Airport | null>(null);
  const [to, setTo] = useState<Airport | null>(null);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airportLoading, setAirportLoading] = useState(true);
  const [airportError, setAirportError] = useState("");

  const [depart, setDepart] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1 Adult");
  const [cabin, setCabin] = useState("Economy");
  const [notice, setNotice] = useState("");

  const [brandLogos, setBrandLogos] =
    useState<BrandLogos | null>(null);

  useEffect(() => {
    fetch("/api/brand")
      .then((response) => response.json())
      .then((data) => {
        if (data.settings) {
          setBrandLogos(data.settings);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("/api/airports")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load airports.");
        }

        return response.json();
      })
      .then((data) => {
        const airportList: Airport[] = data.airports || [];

        setAirports(airportList);

        const defaultFrom =
          airportList.find((airport) => airport.iata_code === "KUL") ||
          airportList[0] ||
          null;

        const defaultTo =
          airportList.find((airport) => airport.iata_code === "BKI") ||
          airportList.find(
            (airport) => airport.iata_code !== defaultFrom?.iata_code
          ) ||
          null;

        setFrom(defaultFrom);
        setTo(defaultTo);
      })
      .catch((error) => {
        console.error(error);
        setAirportError("Unable to load airports. Please refresh the page.");
      })
      .finally(() => {
        setAirportLoading(false);
      });
  }, []);

  function swap() {
    if (!from || !to) return;

    setFrom(to);
    setTo(from);
    setNotice("");
  }

  function searchFlights() {
    setNotice("");

    if (!from || !to) {
      setNotice("Please select both departure and destination airports.");
      return;
    }

    if (from.iata_code === to.iata_code) {
      setNotice("Origin and destination cannot be the same.");
      return;
    }

    if (!depart) {
      setNotice("Please select your departure date.");
      return;
    }

    if (trip === "Return" && !returnDate) {
      setNotice("Please select your return date.");
      return;
    }

    if (trip === "Return" && returnDate < depart) {
      setNotice("Return date must be after departure.");
      return;
    }

    const params = new URLSearchParams({
      from: airportLabel(from),
      to: airportLabel(to),
      depart,
      trip,
      passengers,
      cabin,
      ...(trip === "Return" ? { return: returnDate } : {}),
    });

    window.location.href = `/flights?${params.toString()}`;
  }

  const today = (() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  return (
    <main>
      <header>
        <a href="/" className="brand">
          {brandLogos?.primary_logo_url ? (
            <img
              src={brandLogos.primary_logo_url}
              alt="Seraya Airways"
              className="site-logo"
            />
          ) : (
            <>
              SERAYA
              <small>AIRWAYS</small>
            </>
          )}
        </a>

        <nav>
          <a href="#book">Book</a>
          <a href="#destinations">Destinations</a>
          <a href="#experience">Experience</a>
          <a href="/manage-booking">Manage booking</a>
          <a href="/account">Sign in</a>
        </nav>

        <a href="/account" className="signin">
          Sign in
        </a>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">THE JOURNEY IS YOURS</div>

          <h1>
            Go beyond
            <br />
            <em>the ordinary.</em>
          </h1>

          <p>
            Discover meaningful journeys, thoughtful
            service and the warmth of Malaysian hospitality.
          </p>
        </div>
      </section>

      <section className="booking" id="book">
        <div className="eyebrow">YOUR NEXT JOURNEY</div>

        <h2>Where would you like to go?</h2>

        <div className="trip-toggle">
          <button
            className={trip === "Return" ? "active" : ""}
            onClick={() => setTrip("Return")}
          >
            Return
          </button>

          <button
            className={trip === "One way" ? "active" : ""}
            onClick={() => setTrip("One way")}
          >
            One way
          </button>
        </div>

        <div className="flight-fields">
          <AirportPicker
            label="FROM"
            airports={airports}
            selected={from}
            onSelect={setFrom}
            excludedCode={to?.iata_code}
          />

          <AirportPicker
            label="TO"
            airports={airports}
            selected={to}
            onSelect={setTo}
            excludedCode={from?.iata_code}
          />

          <button
            onClick={swap}
            type="button"
            disabled={!from || !to}
            className="swap-airports"
          >
            ⇅ Swap airports
          </button>

          <label className="field">
            <span>DEPARTURE</span>

            <input
              type="date"
              min={today}
              value={depart}
              onChange={(event) => {
                setDepart(event.target.value);

                if (returnDate && event.target.value > returnDate) {
                  setReturnDate("");
                }
              }}
            />
          </label>

          {trip === "Return" && (
            <label className="field">
              <span>RETURN</span>

              <input
                type="date"
                min={depart || today}
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
              />
            </label>
          )}
        </div>

        {airportLoading && (
          <p className="small-note">Loading available airports...</p>
        )}

        {airportError && (
          <p className="notice">{airportError}</p>
        )}

        {!airportLoading && airports.length === 0 && !airportError && (
          <p className="notice">
            No active airports are available. Please add airports
            through Airport Management.
          </p>
        )}

        <div className="booking-bottom">
          <label>
            PASSENGERS
            <select
              value={passengers}
              onChange={(event) => setPassengers(event.target.value)}
            >
              <option>1 Adult</option>
              <option>2 Adults</option>
              <option>3 Adults</option>
              <option>4 Adults</option>
              <option>2 Adults, 1 Child</option>
            </select>
          </label>

          <label>
            CABIN CLASS
            <select
              value={cabin}
              onChange={(event) => setCabin(event.target.value)}
            >
              <option>Economy</option>
              <option>Business</option>
              <option>First Class</option>
            </select>
          </label>

          <button
            className="search-button"
            onClick={searchFlights}
            disabled={airportLoading || airports.length === 0}
          >
            SEARCH FLIGHTS →
          </button>
        </div>

        {notice && <p className="notice">{notice}</p>}

        <p className="small-note">
          Fictional airline experience · Sample schedules and fares
        </p>
      </section>

      <section className="features" id="experience">
        <div>
          <strong>✧ Thoughtful journeys</strong>
          <p>Service with care.</p>
        </div>

        <div>
          <strong>✧ Made for discovery</strong>
          <p>Explore more of the world.</p>
        </div>

        <div>
          <strong>✧ Your journey, your way</strong>
          <p>Options for every traveller.</p>
        </div>
      </section>

      <section className="destinations" id="destinations">
        <div className="eyebrow">INSPIRATION AWAITS</div>

        <h2>
          Somewhere wonderful
          <br />
          <em>is waiting for you.</em>
        </h2>

        <div className="destination-grid">
          <a
            className="destination"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1000&q=85)",
            }}
            href="/destinations"
          >
            <div>
              <span>MALAYSIA</span>
              <h3>Kuala Lumpur</h3>
            </div>
          </a>

          <a
            className="destination"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1540959733332-eab4de?auto=format&fit=crop&w=1000&q=85)",
            }}
            href="/destinations"
          >
            <div>
              <span>JAPAN</span>
              <h3>Tokyo</h3>
            </div>
          </a>

          <a
            className="destination"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1000&q=85)",
            }}
            href="/destinations"
          >
            <div>
              <span>SINGAPORE</span>
              <h3>Singapore</h3>
            </div>
          </a>
        </div>
      </section>

      <section className="membership">
        <div className="eyebrow">A LITTLE MORE, EVERY TIME</div>

        <h2>
          Every journey has
          <br />
          <em>its rewards.</em>
        </h2>

        <p>
          Discover Seraya Circle, our fictional loyalty programme.
        </p>
      </section>

      <footer>
        <a href="/" className="brand">
          {brandLogos?.wordmark_url || brandLogos?.primary_logo_url ? (
            <img
              src={
                brandLogos?.wordmark_url ||
                brandLogos?.primary_logo_url ||
                ""
              }
              alt="Seraya Airways"
              className="site-logo footer-logo"
            />
          ) : (
            <>
              SERAYA
              <small>AIRWAYS</small>
            </>
          )}
        </a>

        <div className="footer-links">
          <a href="/about">About Seraya</a>
          <a href="/contact">Contact</a>
          <a href="/manage-booking">Manage booking</a>
          <a href="/admin">Administration</a>
        </div>

        <div className="footer-bottom">
          © 2026 Seraya Airways · Fictional airline project
          <br /><br />
          Malaysia · MYR (RM)
        </div>
      </footer>

      <style jsx>{`
        .airport-picker {
          position: relative;
          min-width: 0;
        }

        .airport-picker input {
          width: 100%;
          box-sizing: border-box;
        }

        .airport-results {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 50;
          max-height: 300px;
          overflow-y: auto;
          background: #fff;
          border: 1px solid #e5dfd4;
          border-radius: 10px;
          box-shadow: 0 12px 30px rgba(45, 35, 20, 0.14);
        }

        .airport-result {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 13px;
          text-align: left;
          background: #fff;
          border: 0;
          border-bottom: 1px solid #eee9e0;
          cursor: pointer;
          color: #30291f;
        }

        .airport-result:hover {
          background: #f8f5ef;
        }

        .airport-result-code {
          min-width: 48px;
          font-weight: 700;
          color: #927344;
        }

        .airport-result-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .airport-result-details strong {
          font-size: 13px;
        }

        .airport-result-details small {
          font-size: 11px;
          color: #81786c;
        }

        .airport-empty {
          padding: 16px;
          color: #81786c;
          font-size: 13px;
        }

        .swap-airports {
          padding: 12px;
          border: 1px solid #e5dfd4;
          background: #fff;
          cursor: pointer;
          color: #554735;
          border-radius: 6px;
        }

        .swap-airports:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .search-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 700px) {
          .airport-results {
            max-height: 220px;
          }
        }
      `}</style>
    </main>
  );
}
