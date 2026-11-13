"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Plane, Clock3 } from "lucide-react";

function Results() {
  const params = useSearchParams();
  const from = params.get("from") || "Kuala Lumpur (KUL)";
  const to = params.get("to") || "Kota Kinabalu (BKI)";
  const date = params.get("depart") || "Select a date";
  const cabin = params.get("cabin") || "Economy";

  return (
    <main className="simple-page">
      <a className="back-link" href="/"><ArrowLeft size={16}/> Back to home</a>
      <p className="eyebrow">SERAYA AIRWAYS · FLIGHT SEARCH</p>
      <h1>Your journey starts here.</h1>
      <p className="results-summary">{from} <Plane size={16}/> {to} · {date} · {cabin}</p>
      <div className="empty-state">
        <Clock3 size={30}/>
        <h2>Flight schedules are coming soon.</h2>
        <p>This search is working. We'll connect it to the live Seraya sample-flight database in the next development stage.</p>
        <a className="search-button inline-button" href="/">Modify search</a>
      </div>
    </main>
  );
}

export default function FlightsPage() {
  return <Suspense fallback={<main className="simple-page">Loading flights…</main>}><Results /></Suspense>;
}
