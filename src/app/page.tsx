"use client";

import { useEffect, useState } from "react";

type BrandLogos = {
  primary_logo_url: string | null;
  alternate_logo_url: string | null;
  wordmark_url: string | null;
  }

export default function HomePage() {
  const [trip, setTrip] = useState("Return");
  const [from, setFrom] = useState("Kuala Lumpur (KUL)");
  const [to, setTo] = useState("Kota Kinabalu (BKI)");
  const [depart, setDepart] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1 Adult");
  const [cabin, setCabin] = useState("Economy");
  const [notice, setNotice] = useState("");
  const [brandLogos, setBrandLogos] = useState<BrandLogos | null>(null);

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

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function searchFlights() {
    if (!depart) {
      setNotice("Please select your departure date.");
      return;
    }

    if (trip === "Return" && !returnDate) {
      setNotice("Please select your return date.");
      return;
    }

    if (from === to) {
      setNotice("Origin and destination cannot be the same.");
      return;
    }

    if (returnDate && returnDate < depart) {
      setNotice("Return date must be after departure.");
      return;
    }

    const params = new URLSearchParams({
      from,
      to,
      depart,
      trip,
      passengers,
      cabin,
      ...(trip === "Return" ? { return: returnDate } : {})
    });

    window.location.href = `/flights?${params.toString()}`;
  }

  const today = new Date().toISOString().split("T")[0];

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
          <div className="eyebrow">
            THE JOURNEY IS YOURS
          </div>

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
          <label className="field">
            <span>FROM</span>

            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              <option>Kuala Lumpur (KUL)</option>
              <option>Kota Bharu (KBR)</option>
              <option>Penang (PEN)</option>
              <option>Johor Bahru (JHB)</option>
              <option>Kota Kinabalu (BKI)</option>
              <option>Kuching (KCH)</option>
              <option>Singapore (SIN)</option>
              <option>Tokyo (NRT)</option>
            </select>
          </label>

          <label className="field">
            <span>TO</span>

            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              <option>Kota Kinabalu (BKI)</option>
              <option>Kuala Lumpur (KUL)</option>
              <option>Kota Bharu (KBR)</option>
              <option>Penang (PEN)</option>
              <option>Johor Bahru (JHB)</option>
              <option>Kuching (KCH)</option>
              <option>Singapore (SIN)</option>
              <option>Tokyo (NRT)</option>
            </select>
          </label>

          <button
            onClick={swap}
            type="button"
            style={{
              padding: "12px",
              border: "1px solid #e5dfd4",
              background: "#fff",
              cursor: "pointer"
            }}
          >
            ⇅ Swap airports
          </button>

          <label className="field">
            <span>DEPARTURE</span>

            <input
              type="date"
              min={today}
              value={depart}
              onChange={(e) => {
                setDepart(e.target.value);
                if (returnDate && e.target.value > returnDate) {
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
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </label>
          )}
        </div>

        <div className="booking-bottom">
          <label>
            PASSENGERS
            <select
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
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
              onChange={(e) => setCabin(e.target.value)}
            >
              <option>Economy</option>
              <option>Business</option>
              <option>First Class</option>
            </select>
          </label>

          <button
            className="search-button"
            onClick={searchFlights}
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
                "url(https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1000&q=85)"
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
                "url(https://images.unsplash.com/photo-1540959733332-eab4de?auto=format&fit=crop&w=1000&q=85)"
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
                "url(https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1000&q=85)"
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
    </main>
  );
}
