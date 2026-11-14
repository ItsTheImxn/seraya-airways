
"use client";

import { useCallback, useEffect, useState } from "react";

type SitePage = {
  id: string;
  slug: string;
  title: string;
  page_data: { sections: unknown[] };
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export default function WebsiteDesignerPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSlug, setEditingSlug] = useState("");

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/pages", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load pages.");
      }

      setPages(data.pages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function createPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create page.");
      }

      setTitle("");
      setSlug("");
      setSuccess("Page created successfully.");
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create page.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePage(
    id: string,
    updates: Partial<Pick<SitePage, "title" | "slug" | "is_published">>
  ) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update page.");
      }

      setSuccess("Page updated successfully.");
      setEditingId(null);
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update page.");
    } finally {
      setSaving(false);
    }
  }

  async function duplicatePage(page: SitePage) {
    const newTitle = `${page.title} Copy`;
    const newSlug = `${page.slug}-copy`;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not duplicate page. Check whether the URL is already used."
        );
      }

      // Copy the original page content into the new draft.
      const copyResponse = await fetch("/api/admin/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.page.id,
          page_data: page.page_data,
        }),
      });

      const copyData = await copyResponse.json();

      if (!copyResponse.ok) {
        throw new Error(copyData.error || "Page created, but content could not be copied.");
      }

      setSuccess("Page duplicated successfully.");
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not duplicate page.");
      await loadPages();
    } finally {
      setSaving(false);
    }
  }

  async function deletePage(page: SitePage) {
    const confirmed = window.confirm(
      `Permanently delete "${page.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: page.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete page.");
      }

      setSuccess("Page deleted.");
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete page.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#33291f]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <a
          href="/admin"
          className="mb-7 inline-flex text-sm font-medium text-[#8b7555] hover:text-[#493a2b]"
        >
          ← Back to dashboard
        </a>

        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#a98752]">
            SERAYA AIRWAYS · WEBSITE
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Website designer
          </h1>
          <p className="mt-2 text-sm text-[#83786b]">
            Manage your website pages and prepare content for publishing.
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

        <section className="mb-8 rounded-2xl border border-[#e8e0d4] bg-white p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Create a new page</h2>
            <p className="mt-1 text-sm text-[#83786b]">
              New pages begin as unpublished drafts.
            </p>
          </div>

          <form
            onSubmit={createPage}
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                Page title
              </label>
              <input
                required
                maxLength={100}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setSlug(makeSlug(event.target.value));
                }}
                placeholder="e.g. Our destinations"
                className="w-full rounded-xl border border-[#e4dbce] px-4 py-3 text-sm outline-none focus:border-[#a98752]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                URL slug
              </label>
              <input
                required
                maxLength={80}
                value={slug}
                onChange={(event) => setSlug(makeSlug(event.target.value))}
                placeholder="our-destinations"
                className="w-full rounded-xl border border-[#e4dbce] px-4 py-3 text-sm outline-none focus:border-[#a98752]"
              />
              <p className="mt-1 text-xs text-[#a39787]">
                URL: /pages/{slug || "your-page"}
              </p>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving || !title.trim() || !slug.trim()}
                className="w-full rounded-xl bg-[#493a2b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#65513b] disabled:opacity-50 md:w-auto"
              >
                {saving ? "Working..." : "+ Create page"}
              </button>
            </div>
          </form>
        </section>

        <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Your pages</h2>
            <p className="mt-1 text-sm text-[#83786b]">
              {pages.length} page{pages.length === 1 ? "" : "s"} in your website
            </p>
          </div>

          <button
            type="button"
            onClick={loadPages}
            disabled={loading}
            className="rounded-lg border border-[#e7dfd2] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f5efe5] disabled:opacity-50"
          >
            Refresh
          </button>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-12 text-center text-sm text-[#83786b]">
            Loading pages...
          </div>
        ) : pages.length === 0 ? (
          <div className="rounded-2xl border border-[#e8e0d4] bg-white p-12 text-center">
            <h3 className="text-lg font-semibold">No pages yet</h3>
            <p className="mt-2 text-sm text-[#83786b]">
              Create your first page using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pages.map((page) => (
              <article
                key={page.id}
                className="rounded-2xl border border-[#e8e0d4] bg-white p-5 sm:p-6"
              >
                {editingId === page.id ? (
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <label className="mb-2 block text-xs font-semibold">
                        Page title
                      </label>
                      <input
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        maxLength={100}
                        className="w-full rounded-lg border border-[#e4dbce] px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold">
                        URL slug
                      </label>
                      <input
                        value={editingSlug}
                        onChange={(event) =>
                          setEditingSlug(makeSlug(event.target.value))
                        }
                        maxLength={80}
                        className="w-full rounded-lg border border-[#e4dbce] px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          updatePage(page.id, {
                            title: editingTitle,
                            slug: editingSlug,
                          })
                        }
                        className="rounded-lg bg-[#493a2b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-[#e4dbce] px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold">{page.title}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            page.is_published
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {page.is_published ? "Published" : "Draft"}
                        </span>
                      </div>

                      <p className="break-all text-sm text-[#83786b]">
                        /pages/{page.slug}
                      </p>

                      <p className="mt-2 text-xs text-[#a39787]">
                        {page.page_data?.sections?.length || 0} sections · Last updated{" "}
                        {new Date(page.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(page.id);
                          setEditingTitle(page.title);
                          setEditingSlug(page.slug);
                        }}
                        className="rounded-lg border border-[#e4dbce] px-3 py-2 text-xs font-semibold hover:bg-[#f7f5f0]"
                      >
                        Edit details
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => duplicatePage(page)}
                        className="rounded-lg border border-[#e4dbce] px-3 py-2 text-xs font-semibold hover:bg-[#f7f5f0] disabled:opacity-50"
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          updatePage(page.id, {
                            is_published: !page.is_published,
                          })
                        }
                        className="rounded-lg bg-[#493a2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#65513b] disabled:opacity-50"
                      >
                        {page.is_published ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => deletePage(page)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[#a39787]">
          Seraya Airways · Website management
        </p>
      </div>
    </main>
  );
}
