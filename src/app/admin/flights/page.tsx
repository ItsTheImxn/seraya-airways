
"use client";

import { useCallback, useEffect, useState } from "react";

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
  is_active: boolean;
};

type FlightForm = {
  flight_number: string;
  origin_code: string;
  destination_code: string;
  origin_name: string;
  destination_name: string;
  aircraft: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  base_fare: string;
  is_active: boolean;
};

const emptyForm: FlightForm = {
  flight_number: "",
  origin_code: "",
  destination_code: "",
  origin_name: "",
  destination_name: "",
  aircraft: "",
  departure_time: "",
  arrival_time: "",
  duration: "",
  base_fare: "",
  is_active: true,
};

export default function AdminFlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [form, setForm] = useState<FlightForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFlights = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/flights", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load flights.");
      }

      setFlights(data.flights || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  function updateField<K extends keyof FlightForm>(
    field: K,
    value: FlightForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing(flight: Flight) {
    setEditingId(flight.id);

    setForm({
      flight_number: flight.flight_number,
      origin_code: flight.origin_code,
      destination_code: flight.destination_code,
      origin_name: flight.origin_name,
      destination_name: flight.destination_name,
      aircraft: flight.aircraft,
      departure_time: flight.departure_time.slice(0, 5),
      arrival_time: flight.arrival_time.slice(0, 5),
      duration: flight.duration,
      base_fare: String(flight.base_fare),
      is_active: flight.is_active,
    });

    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        base_fare: Number(form.base_fare),
      };

      const response = await fetch("/api/admin/flights", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          ...(editingId ? { id: editingId } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save flight.");
      }

      setSuccess(
        editingId
          ? "Flight updated successfully."
          : "Flight added successfully."
      );

      resetForm();
      await loadFlights();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleFlight(flight: Flight) {
    const action = flight.is_active ? "deactivate" : "reactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${flight.flight_number}?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/flights", {
        method: flight.is_active ? "DELETE" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          flight.is_active
            ? { id: flight.id }
            : {
                ...flight,
                id: flight.id,
                is_active: true,
              }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update flight status.");
      }

      setSuccess(
        `${flight.flight_number} has been ${action}d successfully.`
      );

      await loadFlights();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  const activeCount = flights.filter((flight) => flight.is_active).length;

  const inputClass =
    "w-full rounded-xl border border-[#e7dfd2] bg-white px-4 py-3 text-sm text-[#33291f] outline-none transition focus:border-[#a98752] focus:ring-2 focus:ring-[#a98752]/15";

  const labelClass =
    "mb-2 block text-xs font-semibold uppercase tracking-wider text-[#766b5e]";

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#33291f]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <a
          href="/admin"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#8b7555] transition hover:text-[#493a2b]"
        >
          ← Back to dashboard
        </a>

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#a98752]">
              SERAYA AIRWAYS · ADMINISTRATION
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Flight management
            </h1>
            <p className="mt-2 text-sm text-[#83786b]">
              Create, update and manage your airline&apos;s flights.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl border border-[#e8e0d4] bg-white px-5 py-3">
              <p className="text-xs text-[#83786b]">Total flights</p>
              <p className="mt-1 text-2xl font-semibold">{flights.length}</p>
            </div>
            <div className="rounded-2xl border border-[#e8e0d4] bg-white px-5 py-3">
              <p className="text-xs text-[#83786b]">Active flights</p>
              <p className="mt-1 text-2xl font-semibold text-[#71805c]">
                {activeCount}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <section className="mb-10 rounded-2xl border border-[#e8e0d4] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a98752]">
                {editingId ? "Edit existing flight" : "Flight configuration"}
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {editingId ? "Update flight" : "Add a new flight"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[#e7dfd2] px-4 py-2 text-sm hover:bg-[#f7f5f0]"
              >
                Cancel editing
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass}>Flight number</label>
                <input
                  className={inputClass}
                  placeholder="SY 201"
                  value={form.flight_number}
                  onChange={(e) =>
                    updateField("flight_number", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Aircraft</label>
                <input
                  className={inputClass}
                  placeholder="Airbus A320neo"
                  value={form.aircraft}
                  onChange={(e) => updateField("aircraft", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Base fare (RM)</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="189.00"
                  value={form.base_fare}
                  onChange={(e) => updateField("base_fare", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Origin airport code</label>
                <input
                  className={inputClass}
                  placeholder="KUL"
                  maxLength={3}
                  value={form.origin_code}
                  onChange={(e) =>
                    updateField("origin_code", e.target.value.toUpperCase())
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Origin airport name</label>
                <input
                  className={inputClass}
                  placeholder="Kuala Lumpur"
                  value={form.origin_name}
                  onChange={(e) => updateField("origin_name", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Destination airport code</label>
                <input
                  className={inputClass}
                  placeholder="PEN"
                  maxLength={3}
                  value={form.destination_code}
                  onChange={(e) =>
                    updateField(
                      "destination_code",
                      e.target.value.toUpperCase()
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Destination airport name</label>
                <input
                  className={inputClass}
                  placeholder="Penang"
                  value={form.destination_name}
                  onChange={(e) =>
                    updateField("destination_name", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Departure time</label>
                <input
                  className={inputClass}
                  type="time"
                  value={form.departure_time}
                  onChange={(e) =>
                    updateField("departure_time", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Arrival time</label>
                <input
                  className={inputClass}
                  type="time"
                  value={form.arrival_time}
                  onChange={(e) =>
                    updateField("arrival_time", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Flight duration</label>
                <input
                  className={inputClass}
                  placeholder="1h 10m"
                  value={form.duration}
                  onChange={(e) => updateField("duration", e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  id="flight-active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    updateField("is_active", e.target.checked)
                  }
                  className="h-4 w-4 accent-[#8b7555]"
                />
                <label
                  htmlFor="flight-active"
                  className="text-sm font-medium text-[#514538]"
                >
                  Flight is active
                </label>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 border-t border-[#eee8de] pt-6">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#493a2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#65513b] disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add flight"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[#e7dfd2] px-6 py-3 text-sm font-medium transition hover:bg-[#f7f5f0]"
              >
                Clear form
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-[#e8e0d4] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a98752]">
                Operations
              </p>
              <h2 className="mt-1 text-xl font-semibold">All flights</h2>
            </div>

            <button
              onClick={loadFlights}
              disabled={loading}
              className="rounded-lg border border-[#e7dfd2] px-4 py-2 text-sm font-medium hover:bg-[#f7f5f0] disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#83786b]">
              Loading flights...
            </div>
          ) : flights.length === 0 ? (
            <div className="rounded-xl bg-[#f8f6f1] px-5 py-12 text-center">
              <p className="font-medium">No flights have been added yet.</p>
              <p className="mt-2 text-sm text-[#83786b]">
                Use the form above to create your first flight.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className="rounded-xl border border-[#eee8de] p-4 transition hover:border-[#d7c7ad] sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold">
                          {flight.flight_number}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            flight.is_active
                              ? "bg-[#edf2e8] text-[#60734e]"
                              : "bg-[#f0ece7] text-[#897c6d]"
                          }`}
                        >
                          {flight.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <div>
                          <p className="text-xl font-semibold">
                            {flight.origin_code}
                          </p>
                          <p className="text-xs text-[#83786b]">
                            {flight.origin_name}
                          </p>
                        </div>

                        <div className="text-sm text-[#a98752]">→</div>

                        <div>
                          <p className="text-xl font-semibold">
                            {flight.destination_code}
                          </p>
                          <p className="text-xs text-[#83786b]">
                            {flight.destination_name}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#83786b]">
                        <span>
                          {flight.departure_time.slice(0, 5)} –{" "}
                          {flight.arrival_time.slice(0, 5)}
                        </span>
                        <span>{flight.duration}</span>
                        <span>{flight.aircraft}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <p className="text-lg font-semibold">
                        RM {Number(flight.base_fare).toFixed(2)}
                      </p>

                      <button
                        onClick={() => startEditing(flight)}
                        className="rounded-lg border border-[#e7dfd2] px-4 py-2 text-sm font-medium hover:bg-[#f7f5f0]"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => toggleFlight(flight)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                          flight.is_active
                            ? "border border-red-200 text-red-700 hover:bg-red-50"
                            : "border border-[#cbd8bf] text-[#60734e] hover:bg-[#edf2e8]"
                        }`}
                      >
                        {flight.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-[#a39889]">
          SERAYA AIRWAYS · INTERNAL ADMINISTRATION PORTAL
        </p>
      </div>
    </main>
  );
}
