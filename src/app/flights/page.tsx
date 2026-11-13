
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function FlightResults() {
  const params = useSearchParams();

  const from = params.get("from") || "Kuala Lumpur (KUL)";
  const to = params.get("to") || "Kota Kinabalu (BKI)";
  const date = params.get("depart") || "";
  const cabin = params.get("cabin") || "Economy";
  const passengers = params.get("passengers") || "1 Adult";

  return (
    <main className="simple-page">
      <a href="/" style={{ fontSize: "12px" }}>
        ← Back to homepage
      </a>

      <p className="eyebrow" style={{ marginTop: "50px" }}>
        SERAYA AIRWAYS · FLIGHT SEARCH
      </p>

      <h1>Your journey starts here.</h1>

      <div className="results-box">
        <h2>{from}</h2>

        <p>✈</p>

        <h2>{to}</h2>

        <hr />

        <p>
          Departure: {date}
          <br />
          Cabin: {cabin}
          <br />
          Passengers: {passengers}
        </p>

        <h3>Flight schedules coming soon</h3>

        <p>
          Your search details have been received.
          Seraya's sample flight inventory will be
          connected in the next development stage.
        </p>

        <a href="/" className="search-button"
          style={{ display: "inline-block" }}>
          MODIFY SEARCH
        </a>
      </div>
    </main>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<main className="simple-page">Loading...</main>}>
      <FlightResults />
    </Suspense>
  );
}
