
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type SectionType = "hero" | "text" | "image" | "gallery" | "destinations" | "booking";

type SiteSection = {
  id: string;
  type: SectionType;
  heading: string;
  text: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
};

type SitePage = {
  id: string;
  title: string;
  slug: string;
  page_data: { sections: SiteSection[] };
  is_published: boolean;
};

const sectionTypes: { type: SectionType; label: string; description: string }[] = [
  { type: "hero", label: "Hero banner", description: "Large introduction with heading and button" },
  { type: "text", label: "Text section", description: "Heading and paragraph content" },
  { type: "image", label: "Image section", description: "A large image with supporting text" },
  { type: "gallery", label: "Image gallery", description: "Gallery section with an image URL" },
  { type: "destinations", label: "Destinations", description: "Destination introduction section" },
  { type: "booking", label: "Booking panel", description: "Call-to-action for flight bookings" },
];

const emptySection = (type: SectionType): SiteSection => ({
  id: crypto.randomUUID(),
  type,
  heading: sectionTypes.find((item) => item.type === type)?.label || "New section",
  text: "",
  imageUrl: "",
  buttonText: "",
  buttonUrl: "",
});

export default function VisualPageEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [page, setPage] = useState<SitePage | null>(null);
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showLibrary, setShowLibrary] = useState(false);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/pages", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load pages.");
      }

      const found = (data.pages || []).find((item: SitePage) => item.id === id);

      if (!found) {
        throw new Error("Page not found.");
      }

      setPage(found);
      setSections(found.page_data?.sections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load page.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const selected = sections.find((section) => section.id === selectedId);

  function updateSection(field: keyof SiteSection, value: string) {
    if (!selectedId) return;

    setSections((current) =>
      current.map((section) =>
        section.id === selectedId ? { ...section, [field]: value } : section
      )
    );
  }

  function addSection(type: SectionType) {
    const section = emptySection(type);
    setSections((current) => [...current, section]);
    setSelectedId(section.id);
    setShowLibrary(false);
    setSuccess("");
  }

  function removeSection(sectionId: string) {
    setSections((current) => current.filter((section) => section.id !== sectionId));
    if (selectedId === sectionId) setSelectedId(null);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    setSections((current) => {
      const updated = [...current];
      [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
      return updated;
    });
  }

  async function savePage(publish?: boolean) {
    if (!page) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updates: Record<string, unknown> = {
        id: page.id,
        page_data: { sections },
      };

      if (typeof publish === "boolean") {
        updates.is_published = publish;
      }

      const response = await fetch("/api/admin/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save page.");
      }

      setPage(data.page);
      setSections(data.page.page_data?.sections || sections);
      setSuccess(
        publish === undefined
          ? "Changes saved successfully."
          : publish
            ? "Page published successfully."
            : "Page saved as a draft."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save page.");
    } finally {
      setSaving(false);
    }
  }

  function renderPreview(section: SiteSection) {
    const commonText = (
      <>
        {section.heading && <h2 className="text-2xl font-semibold">{section.heading}</h2>}
        {section.text && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 opacity-80">{section.text}</p>}
        {section.buttonText && (
          <span className="mt-5 inline-block rounded-lg bg-[#493a2b] px-5 py-3 text-sm font-semibold text-white">
            {section.buttonText}
          </span>
        )}
      </>
    );

    if (section.type === "hero") {
      return (
        <div
          className="flex min-h-64 flex-col justify-center rounded-xl bg-cover bg-center p-8 text-white"
          style={{
            backgroundImage: section.imageUrl
              ? `linear-gradient(#0006,#0006),url("${section.imageUrl}")`
              : "linear-gradient(120deg,#493a2b,#a98752)",
          }}
        >
          <div className="max-w-xl">
            {section.heading && <h2 className="text-3xl font-semibold sm:text-4xl">{section.heading}</h2>}
            {section.text && <p className="mt-3 text-sm leading-7">{section.text}</p>}
            {section.buttonText && <span className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#493a2b]">{section.buttonText}</span>}
          </div>
        </div>
      );
    }

    if (section.type === "image" || section.type === "gallery") {
      return (
        <div className="space-y-4">
          {section.imageUrl ? (
            <img src={section.imageUrl} alt={section.heading || "Page image"} className="max-h-72 w-full rounded-xl object-cover" />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl bg-[#eee8de] text-sm text-[#8b7555]">Image URL not added</div>
          )}
          {commonText}
        </div>
      );
    }

    if (section.type === "booking") {
      return (
        <div className="rounded-xl bg-[#493a2b] px-7 py-10 text-center text-white">
          {section.heading && <h2 className="text-2xl font-semibold">{section.heading}</h2>}
          {section.text && <p className="mx-auto mt-3 max-w-lg text-sm opacity-80">{section.text}</p>}
          <span className="mt-5 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#493a2b]">{section.buttonText || "Book a flight"}</span>
        </div>
      );
    }

    if (section.type === "destinations") {
      return (
        <div className="rounded-xl border border-[#e8e0d4] bg-[#f7f5f0] p-8 text-center">
          {commonText}
          <p className="mt-5 text-xs text-[#8b7555]">Destination cards can be connected in a later update.</p>
        </div>
      );
    }

    return <div className="py-5">{commonText}</div>;
  }

  if (loading) {
    return <main className="min-h-screen bg-[#f7f5f0] p-10 text-center text-[#83786b]">Loading editor...</main>;
  }

  if (!page) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] p-10 text-center">
        <p>{error || "Page not found."}</p>
        <button onClick={() => router.push("/admin/designer")} className="mt-4 underline">Back to pages</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#33291f]">
      <header className="sticky top-0 z-30 border-b border-[#e8e0d4] bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <button onClick={() => router.push("/admin/designer")} className="text-xs text-[#8b7555]">← All pages</button>
            <h1 className="mt-1 text-lg font-semibold">{page.title}</h1>
            <p className="text-xs text-[#83786b]">/{page.slug} · {page.is_published ? "Published" : "Draft"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => savePage()} disabled={saving} className="rounded-lg border border-[#e4dbce] px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Save changes
            </button>
            <button onClick={() => savePage(false)} disabled={saving} className="rounded-lg border border-[#e4dbce] px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Save draft
            </button>
            <button onClick={() => savePage(true)} disabled={saving} className="rounded-lg bg-[#493a2b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Publish
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-4">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</div>}

        <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)_300px]">
          <aside className="h-fit rounded-2xl border border-[#e8e0d4] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Page sections</h2>
              <button onClick={() => setShowLibrary(!showLibrary)} className="rounded-lg bg-[#493a2b] px-3 py-2 text-xs font-semibold text-white">
                + Add
              </button>
            </div>

            {showLibrary && (
              <div className="mb-4 space-y-2 rounded-xl bg-[#f7f5f0] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b7555]">Section library</p>
                {sectionTypes.map((item) => (
                  <button key={item.type} onClick={() => addSection(item.type)} className="block w-full rounded-lg border border-[#e8e0d4] bg-white p-3 text-left hover:border-[#a98752]">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs text-[#83786b]">{item.description}</span>
                  </button>
                ))}
              </div>
            )}

            {sections.length === 0 ? (
              <p className="rounded-xl bg-[#f7f5f0] p-4 text-sm text-[#83786b]">No sections yet. Add your first section.</p>
            ) : (
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div key={section.id} className={`rounded-xl border p-3 ${selectedId === section.id ? "border-[#a98752] bg-[#fbf8f2]" : "border-[#e8e0d4]"}`}>
                    <button onClick={() => setSelectedId(section.id)} className="w-full text-left">
                      <span className="block text-sm font-semibold">{section.heading || section.type}</span>
                      <span className="text-xs capitalize text-[#83786b]">{section.type} section</span>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button disabled={index === 0} onClick={() => moveSection(index, -1)} className="rounded border px-2 py-1 text-xs disabled:opacity-30">↑</button>
                      <button disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)} className="rounded border px-2 py-1 text-xs disabled:opacity-30">↓</button>
                      <button onClick={() => removeSection(section.id)} className="ml-auto rounded border border-red-200 px-2 py-1 text-xs text-red-700">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <section className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Live preview</h2>
              <div className="flex rounded-lg border border-[#e4dbce] bg-white p-1">
                {(["desktop", "tablet", "mobile"] as const).map((item) => (
                  <button key={item} onClick={() => setDevice(item)} className={`rounded-md px-3 py-2 text-xs font-semibold capitalize ${device === item ? "bg-[#493a2b] text-white" : "text-[#83786b]"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#e8e0d4] bg-[#eae6df] p-4">
              <div className={`mx-auto min-h-[650px] bg-white shadow-sm transition-all ${device === "desktop" ? "max-w-full" : device === "tablet" ? "max-w-[768px]" : "max-w-[390px]"}`}>
                <div className="border-b border-[#eee8de] px-6 py-5">
                  <span className="text-lg font-semibold tracking-[0.2em] text-[#493a2b]">SERAYA</span>
                  <span className="ml-2 text-[10px] tracking-[0.3em] text-[#a98752]">AIRWAYS</span>
                </div>
                <div className="space-y-5 p-5 sm:p-8">
                  {sections.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-[#e4dbce] p-12 text-center text-sm text-[#83786b]">Your page preview will appear here.</div>
                  ) : sections.map((section) => (
                    <div key={section.id} onClick={() => setSelectedId(section.id)} className={`cursor-pointer rounded-xl p-2 ${selectedId === section.id ? "ring-2 ring-[#a98752]" : "hover:ring-1 hover:ring-[#d8c5a6]"}`}>
                      {renderPreview(section)}
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#eee8de] px-6 py-5 text-center text-xs text-[#a39787]">SERAYA AIRWAYS</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-[#a39787]">Preview only. Your live website will not change until you publish.</p>
          </section>

          <aside className="h-fit rounded-2xl border border-[#e8e0d4] bg-white p-4">
            <h2 className="mb-4 font-semibold">Section settings</h2>
            {!selected ? (
              <p className="rounded-xl bg-[#f7f5f0] p-4 text-sm text-[#83786b]">Select a section in the left panel or preview to edit it.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Section type</label>
                  <div className="rounded-lg bg-[#f7f5f0] px-3 py-2 text-sm capitalize">{selected.type}</div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Heading</label>
                  <input value={selected.heading} onChange={(event) => updateSection("heading", event.target.value)} className="w-full rounded-lg border border-[#e4dbce] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Text</label>
                  <textarea value={selected.text} onChange={(event) => updateSection("text", event.target.value)} rows={5} className="w-full rounded-lg border border-[#e4dbce] px-3 py-2 text-sm" />
                </div>
                {(selected.type === "hero" || selected.type === "image" || selected.type === "gallery") && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Image URL</label>
                    <input value={selected.imageUrl} onChange={(event) => updateSection("imageUrl", event.target.value)} placeholder="https://..." className="w-full rounded-lg border border-[#e4dbce] px-3 py-2 text-sm" />
                    <p className="mt-1 text-xs text-[#a39787]">You can paste a public URL from your Seraya Media Library.</p>
                  </div>
                )}
                {(selected.type === "hero" || selected.type === "booking" || selected.type === "destinations") && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Button text</label>
                      <input value={selected.buttonText} onChange={(event) => updateSection("buttonText", event.target.value)} placeholder="e.g. Explore flights" className="w-full rounded-lg border border-[#e4dbce] px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold">Button URL</label>
                      <input value={selected.buttonUrl} onChange={(event) => updateSection("buttonUrl", event.target.value)} placeholder="/flights" className="w-full rounded-lg border border-[#e4dbce] px-3 py-2 text-sm" />
                    </div>
                  </>
                )}
                <button onClick={() => removeSection(selected.id)} className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Remove section</button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
