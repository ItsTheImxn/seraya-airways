
"use client";

import { useCallback, useEffect, useState } from "react";

type Airport = {
  id: string;
  iata_code: string;
  airport_name: string;
  city: string;
  country: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

type AirportForm = {
  iata_code: string;
  airport_name: string;
  city: string;
  country: string;
  description: string;
};

const emptyForm: AirportForm = {
  iata_code: "",
  airport_name: "",
  city: "",
  country: "",
  description: "",
};

export default function AdminAirportsPage() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [form, setForm] = useState<AirportForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadAirports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/airports", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load airports.");
      }

      setAirports(data.airports || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load airports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAirports();
  }, [loadAirports]);

  function updateField(
    field: keyof AirportForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: field === "iata_code" ? value.toUpperCase().slice(0, 3) : value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(airport: Airport) {
    setEditingId(airport.id);
    setForm({
      iata_code: airport.iata_code,
      airport_name: airport.airport_name,
      city: airport.city,
      country: airport.country,
      description: airport.description || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveAirport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/airports", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save airport.");
      }

      setSuccess(
        editingId
          ? "Airport updated successfully."
          : "Airport added successfully."
      );

      resetForm();
      await loadAirports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save airport."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(airport: Airport) {
    const action = airport.is_active ? "deactivate" : "reactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${airport.airport_name}?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = airport.is_active
        ? await fetch("/api/admin/airports", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: airport.id }),
          })
        : await fetch("/api/admin/airports", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: airport.id,
              is_active: true,
            }),
          });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Could not ${action} airport.`);
      }

      setSuccess(
        `${airport.iata_code} has been ${action}d successfully.`
      );

      await loadAirports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Could not ${action} airport.`
      );
    }
  }

  const activeCount = airports.filter((airport) => airport.is_active).length;
  const inactiveCount = airports.length - activeCount;

  const filteredAirports = airports.filter((airport) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      airport.iata_code,
      airport.airport_name,
      airport.city,
      airport.country,
    ].some((value) => value.toLowerCase().includes(query));

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && airport.is_active) ||
      (filter === "inactive" && !airport.is_active);

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#33291f]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">

        <a
          href="/admin"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#8b7555] hover:text-[#493a2b]"
        >
          ← Back to dashboard
        </a>

        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#a98752]">
            SERAYA AIRWAYS · MANAGEMENT
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Airport management
          </h1>

          <p className="mt-2 text-sm text-[#83786b]">
            Add and manage the airports available throughout Seraya Airways.
          </p>
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

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5">
            <p className="text-sm text-[#83786b]">Total airports</p>
            <p className="mt-2 text-3xl font-semibold">{airports.length}</p>
          </div>

          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5">
            <p className="text-sm text-[#83786b]">Active airports</p>
            <p className="mt-2 text-3xl font-semibold text-green-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-5">
            <p className="text-sm text-[#83786b]">Inactive airports</p>
            <p className="mt-2 text-3xl font-semibold text-[#98703e]">
              {inactiveCount}
            </p>
          </div>
        </section>

        <section className="mb-9 rounded-2xl border border-[#e8e0d4] bg-white p-5 sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {editingId ? "Edit airport" : "Add a new airport"}
              </h2>

              <p className="mt-1 text-sm text-[#83786b]">
                Enter the airport details below.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[#e7dfd2] px-4 py-2 text-sm font-medium hover:bg-[#f7f5f0]"
              >
                Cancel editing
              </button>
            )}
          </div>

          <form onSubmit={saveAirport} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  IATA code *
                </label>

                <input
                  required
                  maxLength={3}
                  minLength={3}
                  value={form.iata_code}
                  onChange={(event) =>
                    updateField("iata_code", event.target.value)
                  }
                  placeholder="KUL"
                  className="w-full rounded-xl border border-[#ded4c5] bg-[#fdfcf9] px-4 py-3 text-sm uppercase outline-none focus:border-[#98703e]"
                />

                <p className="mt-1 text-xs text-[#a39787]">
                  Three-letter airport code.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Airport name *
                </label>

                <input
                  required
                  value={form.airport_name}
                  onChange={(event) =>
                    updateField("airport_name", event.target.value)
                  }
                  placeholder="Kuala Lumpur International Airport"
                  className="w-full rounded-xl border border-[#ded4c5] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#98703e]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  City *
                </label>

                <input
                  required
                  value={form.city}
                  onChange={(event) =>
                    updateField("city", event.target.value)
                  }
                  placeholder="Kuala Lumpur"
                  className="w-full rounded-xl border border-[#ded4c5] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#98703e]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Country *
                </label>

                <input
                  required
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                  placeholder="Malaysia"
                  className="w-full rounded-xl border border-[#ded4c5] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#98703e]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Optional airport information..."
                className="w-full rounded-xl border border-[#ded4c5] bg-[#fdfcf9] px-4 py-3 text-sm outline-none focus:border-[#98703e]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#493a2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#65513b] disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save airport changes"
                  : "+ Add airport"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold">Airport directory</h2>
              <p className="mt-1 text-sm text-[#83786b]">
                Search, edit, activate or deactivate airports.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAirports}
              disabled={loading}
              className="rounded-lg border border-[#e7dfd2] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f5efe5] disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search airport, city, country or IATA code..."
              className="w-full rounded-xl border border-[#ded4c5] bg-white px-4 py-3 text-sm outline-none focus:border-[#98703e]"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-[#ded4c5] bg-white px-4 py-3 text-sm outline-none focus:border-[#98703e]"
            >
              <option value="all">All airports</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#e8e0d4] bg-white p-12 text-center text-sm text-[#83786b]">
              Loading airports...
            </div>
          ) : filteredAirports.length === 0 ? (
            <div className="rounded-2xl border border-[#e8e0d4] bg-white p-12 text-center">
              <h3 className="font-semibold">No airports found</h3>
              <p className="mt-2 text-sm text-[#83786b]">
                Add an airport or try another search.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#e8e0d4] bg-white">
              <div className="divide-y divide-[#eee8df]">
                {filteredAirports.map((airport) => (
                  <article
                    key={airport.id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-[#f5efe5] text-lg font-bold tracking-wider text-[#98703e]">
                        {airport.iata_code}
                      </div>

                      <div>
                        <h3 className="font-semibold">
                          {airport.airport_name}
                        </h3>

                        <p className="mt-1 text-sm text-[#83786b]">
                          {airport.city}, {airport.country}
                        </p>

                        {airport.description && (
                          <p className="mt-1 text-xs text-[#a39787]">
                            {airport.description}
                          </p>
                        )}

                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            airport.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-[#f1eee8] text-[#83786b]"
                          }`}
                        >
                          {airport.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(airport)}
                        className="rounded-lg border border-[#e7dfd2] px-4 py-2 text-xs font-semibold hover:bg-[#f7f5f0]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStatus(airport)}
                        className={`rounded-lg border px-4 py-2 text-xs font-semibold ${
                          airport.is_active
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {airport.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-[#a39787]">
          Seraya Airways · Airport management
        </p>
      </div>
    </main>
  );
}
