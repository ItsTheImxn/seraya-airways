
"use client";

import { useState } from "react";

type Booking = {
  pnr: string;
  passenger_name: string;
  passenger_email: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_date: string;
  booking_status: string;
  created_at: string;
};

export default function ManageBookingPage() {
  const [pnr, setPnr] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const response = await fetch("/api/manage-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pnr: pnr.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to find your booking.");
      }

      setBooking(data.booking);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setBooking(null);
    setPnr("");
    setEmail("");
    setError("");
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <main className="manage-page">
      <header className="manage-header">
        <a href="/" className="manage-brand">
          SERAYA
          <small>AIRWAYS</small>
        </a>

        <nav>
          <a href="/">Home</a>
          <a href="/flights">Book flights</a>
          <a href="/account">Sign in</a>
        </nav>
      </header>

      <section className="manage-hero">
        <div className="manage-eyebrow">YOUR JOURNEY, YOUR WAY</div>
        <h1>Manage your booking.</h1>
        <p>
          Retrieve your reservation and view your journey details
          in one place.
        </p>
      </section>

      <section className="manage-content">
        {!booking ? (
          <div className="lookup-card">
            <div className="manage-eyebrow">BOOKING RETRIEVAL</div>

            <h2>Find your booking</h2>

            <p className="lookup-description">
              Enter your booking reference and the email address
              used when making your reservation.
            </p>

            <form onSubmit={findBooking}>
              <label>
                BOOKING REFERENCE (PNR)
                <input
                  type="text"
                  placeholder="e.g. SYABC234"
                  value={pnr}
                  onChange={(event) =>
                    setPnr(event.target.value.toUpperCase())
                  }
                  maxLength={8}
                  required
                />
              </label>

              <label>
                PASSENGER EMAIL ADDRESS
                <input
                  type="email"
                  placeholder="Enter your booking email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              {error && (
                <div className="manage-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="manage-button"
                disabled={loading}
              >
                {loading ? "RETRIEVING BOOKING..." : "FIND MY BOOKING →"}
              </button>
            </form>

            <div className="lookup-help">
              <strong>Where can I find my PNR?</strong>
              <p>
                Your booking reference is provided when your
                reservation is confirmed.
              </p>
            </div>
          </div>
        ) : (
          <div className="booking-details">
            <div className="booking-success">
              <div>
                <div className="manage-eyebrow">BOOKING RETRIEVED</div>
                <h2>Your journey details</h2>
              </div>

              <span className="status-label">
                {booking.booking_status}
              </span>
            </div>

            <div className="pnr-panel">
              <span>BOOKING REFERENCE</span>
              <strong>{booking.pnr}</strong>
            </div>

            <div className="journey-panel">
              <div className="manage-eyebrow">FLIGHT INFORMATION</div>

              <div className="journey-route">
                <div>
                  <strong>{booking.origin}</strong>
                  <small>DEPARTURE</small>
                </div>

                <div className="route-line">
                  <span>✈</span>
                  <div />
                  <small>{booking.flight_number}</small>
                </div>

                <div>
                  <strong>{booking.destination}</strong>
                  <small>ARRIVAL</small>
                </div>
              </div>

              <div className="journey-date">
                <span>DEPARTURE DATE</span>
                <strong>{formatDate(booking.departure_date)}</strong>
              </div>
            </div>

            <div className="passenger-panel">
              <div className="manage-eyebrow">PASSENGER INFORMATION</div>

              <div className="passenger-grid">
                <div>
                  <span>PASSENGER NAME</span>
                  <strong>{booking.passenger_name}</strong>
                </div>

                <div>
                  <span>EMAIL ADDRESS</span>
                  <strong>{booking.passenger_email}</strong>
                </div>
              </div>
            </div>

            <div className="booking-actions">
              <button
                type="button"
                className="manage-button"
                onClick={resetSearch}
              >
                LOOK UP ANOTHER BOOKING
              </button>

              <a href="/" className="back-home">
                Back to Seraya Airways
              </a>
            </div>

            <p className="future-note">
              Flight changes, seat selection and online check-in
              will be introduced in future updates.
            </p>
          </div>
        )}
      </section>

      <footer className="manage-footer">
        SERAYA AIRWAYS · MALAYSIA
        <p>© 2026 Seraya Airways · Fictional airline project</p>
      </footer>

      <style jsx>{`
        .manage-page {
          min-height: 100vh;
          background: #f7f4ed;
          color: #24231f;
          font-family: 'DM Sans', sans-serif;
        }

        .manage-header {
          height: 82px;
          padding: 0 8%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
        }

        .manage-brand {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .manage-brand small {
          display: block;
          margin-top: 4px;
          color: #b28a45;
          font-size: 9px;
          letter-spacing: 5px;
        }

        .manage-header nav {
          display: flex;
          gap: 28px;
          font-size: 12px;
        }

        .manage-hero {
          padding: 75px 8% 85px;
          background: #302e28;
          color: white;
        }

        .manage-eyebrow {
          color: #b28a45;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
        }

        .manage-hero h1 {
          margin: 18px 0;
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 6vw, 58px);
          font-weight: 500;
        }

        .manage-hero p {
          color: #ddd6c9;
          font-size: 13px;
          line-height: 1.8;
        }

        .manage-content {
          width: 90%;
          max-width: 850px;
          margin: -35px auto 80px;
          position: relative;
        }

        .lookup-card,
        .booking-details {
          padding: 38px;
          background: white;
          box-shadow: 0 12px 45px #00000012;
        }

        .lookup-card h2,
        .booking-details h2 {
          margin: 12px 0;
          font-family: 'Playfair Display', serif;
          font-size: 29px;
          font-weight: 500;
        }

        .lookup-description {
          margin-bottom: 28px;
          color: #81796e;
          font-size: 12px;
          line-height: 1.8;
        }

        .lookup-card form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .lookup-card label {
          display: flex;
          flex-direction: column;
          gap: 9px;
          color: #81796e;
          font-size: 10px;
          letter-spacing: 1.5px;
        }

        .lookup-card input {
          width: 100%;
          padding: 15px;
          border: 1px solid #e5dfd4;
          outline: none;
          color: #24231f;
          background: white;
          font-size: 13px;
          letter-spacing: normal;
        }

        .lookup-card input:focus {
          border-color: #b28a45;
        }

        .manage-button {
          width: 100%;
          padding: 17px 20px;
          border: none;
          background: #c66a3b;
          color: white;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .manage-button:hover {
          background: #a9522c;
        }

        .manage-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .manage-error {
          padding: 13px;
          background: #fff1ed;
          color: #a3482c;
          font-size: 12px;
          line-height: 1.6;
        }

        .lookup-help {
          margin-top: 30px;
          padding-top: 22px;
          border-top: 1px solid #eee9e0;
          font-size: 11px;
        }

        .lookup-help p {
          color: #81796e;
          line-height: 1.7;
        }

        .booking-success {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .status-label {
          padding: 8px 12px;
          background: #edf4e9;
          color: #46633d;
          font-size: 10px;
          text-transform: uppercase;
          border-radius: 20px;
        }

        .pnr-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 25px 0;
          padding: 22px;
          background: #302e28;
          color: white;
        }

        .pnr-panel span,
        .journey-date span,
        .passenger-grid span {
          color: #b9ad9c;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .pnr-panel strong {
          color: #e5c58d;
          font-size: 25px;
          letter-spacing: 4px;
        }

        .journey-panel,
        .passenger-panel {
          margin-top: 20px;
          padding: 24px;
          border: 1px solid #e5dfd4;
        }

        .journey-route {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: center;
          gap: 12px;
          margin: 35px 0;
        }

        .journey-route > div:not(.route-line) {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .journey-route > div:last-child {
          text-align: right;
        }

        .journey-route strong {
          font-size: 17px;
          overflow-wrap: anywhere;
        }

        .journey-route small {
          color: #938b7d;
          font-size: 9px;
        }

        .route-line {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #b28a45;
        }

        .route-line div {
          width: 100%;
          border-top: 1px solid #d8c9ae;
        }

        .journey-date {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 18px;
          border-top: 1px solid #eee9e0;
        }

        .journey-date strong {
          font-size: 13px;
        }

        .passenger-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 22px;
        }

        .passenger-grid div {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .passenger-grid strong {
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .booking-actions {
          margin-top: 25px;
        }

        .back-home {
          display: block;
          margin-top: 18px;
          text-align: center;
          color: #81796e;
          font-size: 11px;
        }

        .future-note {
          margin-top: 25px;
          color: #999;
          font-size: 10px;
          line-height: 1.7;
          text-align: center;
        }

        .manage-footer {
          padding: 35px 8%;
          background: #302e28;
          color: #e5c58d;
          font-size: 10px;
          letter-spacing: 2px;
          text-align: center;
        }

        .manage-footer p {
          color: #aaa;
          font-size: 10px;
          letter-spacing: normal;
        }

        @media (max-width: 600px) {
          .manage-header {
            padding: 0 5%;
          }

          .manage-header nav {
            display: none;
          }

          .manage-hero {
            padding: 60px 7% 75px;
          }

          .manage-content {
            width: 92%;
          }

          .lookup-card,
          .booking-details {
            padding: 24px 18px;
          }

          .journey-panel,
          .passenger-panel {
            padding: 17px;
          }

          .passenger-grid {
            grid-template-columns: 1fr;
          }

          .journey-route {
            gap: 7px;
          }

          .journey-route strong {
            font-size: 13px;
          }

          .booking-success {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
