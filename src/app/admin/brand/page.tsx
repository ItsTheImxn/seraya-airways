
"use client";

import { useCallback, useEffect, useState } from "react";

type BrandSettings = {
  primary_logo_url: string;
  alternate_logo_url: string;
  wordmark_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  heading_font: string;
  body_font: string;
};

type MediaFile = {
  name: string;
  url: string;
  content_type: string;
  size: number;
};

const DEFAULTS: BrandSettings = {
  primary_logo_url: "",
  alternate_logo_url: "",
  wordmark_url: "",
  favicon_url: "",
  primary_color: "#8B6F47",
  secondary_color: "#D8B98A",
  accent_color: "#B58A50",
  background_color: "#F8F5EF",
  text_color: "#30271F",
  heading_font: "DM Sans",
  body_font: "DM Sans",
};

const COLORS: {
  key: keyof BrandSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "primary_color",
    label: "Primary colour",
    description: "Main buttons and important brand elements",
  },
  {
    key: "secondary_color",
    label: "Secondary colour",
    description: "Supporting backgrounds and details",
  },
  {
    key: "accent_color",
    label: "Accent colour",
    description: "Highlights and decorative elements",
  },
  {
    key: "background_color",
    label: "Background colour",
    description: "Main website background",
  },
  {
    key: "text_color",
    label: "Text colour",
    description: "Main website text",
  },
];

const FONTS = [
  "DM Sans",
  "Inter",
  "Arial",
  "Helvetica",
  "Georgia",
  "Lato",
  "Montserrat",
  "Poppins",
  "Roboto",
  "Playfair Display",
];

const LOGOS: {
  key: keyof BrandSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "primary_logo_url",
    label: "Primary logo",
    description: "Your main airline logo",
  },
  {
    key: "alternate_logo_url",
    label: "Alternate logo",
    description: "A secondary or reversed logo",
  },
  {
    key: "wordmark_url",
    label: "Wordmark",
    description: "Your Seraya Airways wordmark",
  },
  {
    key: "favicon_url",
    label: "Favicon",
    description: "The small icon shown in browser tabs",
  },
];

export default function AdminBrandPage() {
  const [settings, setSettings] = useState<BrandSettings>(DEFAULTS);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [brandResponse, mediaResponse] = await Promise.all([
        fetch("/api/admin/brand", { cache: "no-store" }),
        fetch("/api/admin/media", { cache: "no-store" }),
      ]);

      const brandData = await brandResponse.json();
      const mediaData = await mediaResponse.json();

      if (!brandResponse.ok) {
        throw new Error(
          brandData.error || "Could not load brand settings."
        );
      }

      if (!mediaResponse.ok) {
        throw new Error(
          mediaData.error || "Could not load your media library."
        );
      }

      if (brandData.settings) {
        setSettings({
          ...DEFAULTS,
          ...brandData.settings,
        });
      }

      setMedia(mediaData.files || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load brand settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateSetting(key: keyof BrandSettings, value: string) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSuccess("");
  }

  async function saveSettings() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/brand", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save brand settings.");
      }

      setSettings({
        ...DEFAULTS,
        ...data.settings,
      });

      setSuccess("Your brand identity settings have been saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  function selectedImage(url: string) {
    return media.find((file) => file.url === url);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0] text-[#493a2b]">
        Loading brand identity settings...
      </main>
    );
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

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#a98752]">
              SERAYA AIRWAYS · WEBSITE
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Brand identity
            </h1>

            <p className="mt-2 text-sm text-[#83786b]">
              Manage your airline's logos, colours and typography.
            </p>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="rounded-xl bg-[#493a2b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#65513b] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
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

        <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
          <div className="space-y-7">
            <section className="rounded-2xl border border-[#e8e0d4] bg-white p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Logo collection</h2>
                <p className="mt-1 text-sm text-[#83786b]">
                  Choose images you've uploaded to your Media Library.
                </p>
              </div>

              <div className="space-y-6">
                {LOGOS.map((logo) => {
                  const currentUrl = settings[logo.key];
                  const selected = selectedImage(currentUrl);

                  return (
                    <div
                      key={logo.key}
                      className="grid gap-4 sm:grid-cols-[1fr_180px]"
                    >
                      <div>
                        <label className="text-sm font-semibold">
                          {logo.label}
                        </label>

                        <p className="mb-3 mt-1 text-xs text-[#83786b]">
                          {logo.description}
                        </p>

                        <select
                          value={currentUrl}
                          onChange={(event) =>
                            updateSetting(logo.key, event.target.value)
                          }
                          className="w-full rounded-xl border border-[#e4dbce] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98752]"
                        >
                          <option value="">No image selected</option>

                          {media.map((file) => (
                            <option key={file.url} value={file.url}>
                              {file.name}
                            </option>
                          ))}
                        </select>

                        {currentUrl && !selected && (
                          <p className="mt-2 text-xs text-amber-700">
                            This image is not currently listed in your Media Library.
                          </p>
                        )}
                      </div>

                      <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-[#e8e0d4] bg-[#f7f5f0] p-3">
                        {currentUrl ? (
                          <img
                            src={currentUrl}
                            alt={logo.label}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-[#a39787]">
                            No image selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <a
                href="/admin/media"
                className="mt-6 inline-flex text-sm font-semibold text-[#8b6f47] hover:underline"
              >
                Open Media Library →
              </a>
            </section>

            <section className="rounded-2xl border border-[#e8e0d4] bg-white p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Brand colours</h2>
                <p className="mt-1 text-sm text-[#83786b]">
                  Set the colours used throughout your website.
                </p>
              </div>

              <div className="space-y-5">
                {COLORS.map((color) => (
                  <div
                    key={color.key}
                    className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {color.label}
                      </p>
                      <p className="mt-1 text-xs text-[#83786b]">
                        {color.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings[color.key]}
                        onChange={(event) =>
                          updateSetting(color.key, event.target.value)
                        }
                        className="h-11 w-14 cursor-pointer rounded-lg border border-[#e4dbce] bg-white p-1"
                        aria-label={color.label}
                      />

                      <input
                        type="text"
                        value={settings[color.key]}
                        onChange={(event) =>
                          updateSetting(
                            color.key,
                            event.target.value.toUpperCase()
                          )
                        }
                        maxLength={7}
                        className="w-28 rounded-lg border border-[#e4dbce] px-3 py-2 text-sm uppercase outline-none focus:border-[#a98752]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e8e0d4] bg-white p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Typography</h2>
                <p className="mt-1 text-sm text-[#83786b]">
                  Choose the fonts for headings and general website content.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Heading font
                  </label>

                  <select
                    value={settings.heading_font}
                    onChange={(event) =>
                      updateSetting("heading_font", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#e4dbce] bg-white px-4 py-3 text-sm"
                  >
                    {FONTS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Body font
                  </label>

                  <select
                    value={settings.body_font}
                    onChange={(event) =>
                      updateSetting("body_font", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#e4dbce] bg-white px-4 py-3 text-sm"
                  >
                    {FONTS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-[#e8e0d4] bg-white">
              <div className="border-b border-[#e8e0d4] p-5">
                <h2 className="font-semibold">Live brand preview</h2>
                <p className="mt-1 text-xs text-[#83786b]">
                  Preview your current selections.
                </p>
              </div>

              <div
                className="p-6"
                style={{
                  backgroundColor: settings.background_color,
                  color: settings.text_color,
                  fontFamily: settings.body_font,
                }}
              >
                <div className="mb-7 flex min-h-16 items-center justify-center">
                  {settings.primary_logo_url ? (
                    <img
                      src={settings.primary_logo_url}
                      alt="Seraya Airways logo"
                      className="max-h-16 max-w-full object-contain"
                    />
                  ) : (
                    <span
                      className="text-xl font-semibold tracking-[0.15em]"
                      style={{ color: settings.primary_color }}
                    >
                      SERAYA AIRWAYS
                    </span>
                  )}
                </div>

                <p
                  className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em]"
                  style={{ color: settings.accent_color }}
                >
                  YOUR JOURNEY BEGINS
                </p>

                <h3
                  className="mb-3 text-2xl font-semibold"
                  style={{
                    fontFamily: settings.heading_font,
                  }}
                >
                  Discover a new way to fly.
                </h3>

                <p className="mb-6 text-xs leading-6 opacity-75">
                  Experience thoughtful service and a journey designed around you.
                </p>

                <button
                  type="button"
                  className="w-full rounded-lg px-4 py-3 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: settings.primary_color,
                  }}
                >
                  Book your flight
                </button>

                <div className="mt-5 flex gap-2">
                  {[settings.primary_color, settings.secondary_color, settings.accent_color].map(
                    (colour, index) => (
                      <div
                        key={index}
                        className="h-8 flex-1 rounded-md"
                        style={{ backgroundColor: colour }}
                      />
                    )
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e8e0d4] bg-white p-5">
              <h3 className="font-semibold">Brand settings</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-[#83786b]">Heading font</span>
                  <span className="font-medium">{settings.heading_font}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-[#83786b]">Body font</span>
                  <span className="font-medium">{settings.body_font}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-[#83786b]">Uploaded assets</span>
                  <span className="font-medium">{media.length}</span>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="w-full rounded-xl bg-[#493a2b] px-5 py-3 font-semibold text-white hover:bg-[#65513b] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save brand identity"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
