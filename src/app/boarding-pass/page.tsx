
"use client";

import { useState } from "react";

type BoardingPassData = {
  pnr: string;
  passengerName: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  bookingStatus: string;
  seatNumber: string | null;
  gate: string | null;
  boardingTime: string | null;
  checkInStatus: string;
  checkedInAt: string | null;
  issuedAt: string | null;
};

export default function BoardingPassPage() {
  const [pnr, setPnr] = useState("");
  const [email, setEmail] = useState("");
  const [boardingPass, setBoardingPass] =
    useState<BoardingPassData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findBoardingPass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setBoardingPass(null);

    try {
      const response = await fetch("/api/boarding-pass", {
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

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to retrieve your boarding pass."
        );
      }

      setBoardingPass(data.boardingPass);
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

  function formatDate(date: string) {
    if (!date) return "Pending";

    const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(time: string | null) {
    if (!time) return "Pending";

    const parsed = new Date(time);

    if (Number.isNaN(parsed.getTime())) return time;

    return parsed.toLocaleTimeString("en-MY", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const isCheckedIn =
    boardingPass?.checkInStatus === "checked_in";

  const isIssued = Boolean(boardingPass?.issuedAt);

  return (
    <main className="min-h-screen bg-[#f5f1e9] text-[#302b25]">
      <header className="border-b border-[#ded4c4] bg-[#fbf9f5] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a
            href="/"
            className="text-2xl font-semibold tracking-[0.18em] text-[#80623c]"
          >
            SERAYA
          </a>

          <a
            href="/manage-booking"
            className="text-sm font-medium text-[#80623c] hover:underline"
          >
            Manage Booking
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="mb-9 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#a17b49]">
            Your journey begins here
          </p>

          <h1 className="text-3xl font-semibold md:text-4xl">
            Digital Boarding Pass
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#777064]">
            Retrieve your Seraya booking and view your boarding
            information using your booking reference and passenger email.
          </p>
        </div>

        {!boardingPass && (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#e1d7c8] bg-white p-7 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold">
              Retrieve your booking
            </h2>

            <p className="mb-6 text-sm text-[#81796e]">
              Enter the details associated with your reservation.
            </p>

            <form onSubmit={findBoardingPass} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Booking reference (PNR)
                </label>

                <input
                  value={pnr}
                  onChange={(e) =>
                    setPnr(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. SYABC123"
                  maxLength={8}
                  required
                  className="w-full rounded-xl border border-[#ded5c8] bg-[#fdfcf9] px-4 py-3 uppercase tracking-widest outline-none focus:border-[#a17b49]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Passenger email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your booking email"
                  required
                  className="w-full rounded-xl border border-[#ded5c8] bg-[#fdfcf9] px-4 py-3 outline-none focus:border-[#a17b49]"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#80623c] px-5 py-3.5 font-semibold text-white transition hover:bg-[#674d2e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Retrieving booking..." : "Retrieve Boarding Pass"}
              </button>
            </form>
          </div>
        )}

        {boardingPass && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <button
                onClick={() => setBoardingPass(null)}
                className="text-sm font-medium text-[#80623c] hover:underline"
              >
                ← Look up another booking
              </button>

              <button
                onClick={() => window.print()}
                disabled={!isCheckedIn || !isIssued}
                className="rounded-xl bg-[#80623c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#674d2e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Print / Save as PDF
              </button>
            </div>

            <div
              id="boarding-pass"
              className="overflow-hidden rounded-2xl border border-[#dfd4c3] bg-white shadow-sm"
            >
              <div className="bg-[#80623c] px-7 py-6 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold tracking-[0.2em]">
                      SERAYA
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/75">
                      Digital boarding pass
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-white/70">
                      Booking reference
                    </p>
                    <p className="mt-1 text-xl font-bold tracking-widest">
                      {boardingPass.pnr}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-7">
                <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#968a79]">
                      Passenger
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {boardingPass.passengerName}
                    </p>
                  </div>

                  <div className="rounded-full bg-[#f3eee5] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#80623c]">
                    {boardingPass.bookingStatus}
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-y border-dashed border-[#ded5c8] py-8">
                  <div>
                    <p className="text-3xl font-semibold">
                      {boardingPass.origin}
                    </p>
                    <p className="mt-2 text-xs text-[#81796e]">
                      Origin
                    </p>
                  </div>

                  <div className="text-center text-[#a17b49]">
                    <div className="text-2xl">✈</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest">
                      Seraya
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-semibold">
                      {boardingPass.destination}
                    </p>
                    <p className="mt-2 text-xs text-[#81796e]">
                      Destination
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-7 py-7 sm:grid-cols-3">
                  <Detail
                    label="Flight"
                    value={boardingPass.flightNumber}
                  />
                  <Detail
                    label="Departure date"
                    value={formatDate(boardingPass.departureDate)}
                  />
                  <Detail
                    label="Seat"
                    value={boardingPass.seatNumber || "Pending"}
                  />
                  <Detail
                    label="Gate"
                    value={boardingPass.gate || "Pending"}
                  />
                  <Detail
                    label="Boarding time"
                    value={formatTime(boardingPass.boardingTime)}
                  />
                  <Detail
                    label="Check-in"
                    value={
                      isCheckedIn
                        ? "Checked in"
                        : "Not checked in"
                    }
                  />
                </div>

                <div className="rounded-xl bg-[#f7f4ee] p-5 text-center">
                  {isCheckedIn && isIssued ? (
                    <>
                      <p className="font-semibold text-[#496c4b]">
                        Boarding pass issued
                      </p>
                      <p className="mt-1 text-sm text-[#777064]">
                        Your boarding pass has been issued. Please
                        check your flight details before departure.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#80623c]">
                        Your booking is confirmed
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#777064]">
                        Your boarding pass is not yet issued. Check-in,
                        seat assignment and airport details will appear
                        here when they become available.
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#e9e1d6] pt-5 text-xs text-[#968a79]">
                  <span>SERAYA AIRWAYS</span>
                  <span>Thank you for flying with us.</span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs leading-5 text-[#8a8175] print:hidden">
              This page currently displays your booking and assigned
              check-in information. It is not yet an airport-valid
              boarding credential.
            </p>
          </div>
        )}
      </section>

      <footer className="border-t border-[#ded4c4] px-6 py-6 text-center text-xs text-[#968a79]">
        © {new Date().getFullYear()} Seraya Airways. All rights reserved.
      </footer>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          header,
          footer,
          .print\\:hidden {
            display: none !important;
          }

          main {
            min-height: 0 !important;
            background: white !important;
          }

          #boarding-pass {
            border: 1px solid #ded4c4 !important;
            box-shadow: none !important;
          }

          section {
            padding: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-[#968a79]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-[#302b25]">
        {value}
      </p>
    </div>
  );
}
