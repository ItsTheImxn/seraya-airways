
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import "./globals.css";

export const dynamic = "force-dynamic";

type BrandSettings = {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  heading_font: string;
  body_font: string;
  favicon_url: string | null;
};

const defaultBrand: BrandSettings = {
  primary_color: "#8B6F47",
  secondary_color: "#D8B98A",
  accent_color: "#B58A50",
  background_color: "#F8F5EF",
  text_color: "#30271F",
  heading_font: "DM Sans",
  body_font: "DM Sans",
  favicon_url: null,
};

const allowedFonts = [
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

async function getBrandSettings(): Promise<BrandSettings> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return defaultBrand;

  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/brand_settings?id=eq.default&select=*`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return defaultBrand;

    const data = await response.json();
    const settings = data[0];

    if (!settings) return defaultBrand;

    const validColor = (value: unknown, fallback: string) =>
      typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
        ? value
        : fallback;

    const validFont = (value: unknown) =>
      typeof value === "string" && allowedFonts.includes(value)
        ? value
        : "DM Sans";

    const favicon =
      typeof settings.favicon_url === "string" &&
      settings.favicon_url.startsWith(
        `${url.replace(/\/$/, "")}/storage/v1/object/public/seraya-media/`
      )
        ? settings.favicon_url
        : null;

    return {
      primary_color: validColor(settings.primary_color, defaultBrand.primary_color),
      secondary_color: validColor(settings.secondary_color, defaultBrand.secondary_color),
      accent_color: validColor(settings.accent_color, defaultBrand.accent_color),
      background_color: validColor(settings.background_color, defaultBrand.background_color),
      text_color: validColor(settings.text_color, defaultBrand.text_color),
      heading_font: validFont(settings.heading_font),
      body_font: validFont(settings.body_font),
      favicon_url: favicon,
    };
  } catch {
    return defaultBrand;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();

  return {
    title: "Seraya Airways | Discover More",
    description: "The official Seraya Airways booking experience.",
    ...(brand.favicon_url
      ? {
          icons: {
            icon: brand.favicon_url,
          },
        }
      : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const brand = await getBrandSettings();

  const brandStyle = {
    "--ink": brand.text_color,
    "--gold": brand.accent_color,
    "--orange": brand.primary_color,
    "--cream": brand.background_color,
    "--secondary": brand.secondary_color,
    "--heading-font": `"${brand.heading_font}", sans-serif`,
    "--body-font": `"${brand.body_font}", sans-serif`,
  } as CSSProperties;

  return (
    <html lang="en">
      <body style={brandStyle}>{children}</body>
    </html>
  );
}
