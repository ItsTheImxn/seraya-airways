
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SiteSection = {
  id?: string;
  type: string;
  heading?: string;
  text?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
};

type SitePage = {
  id: string;
  slug: string;
  title: string;
  page_data: {
    sections: SiteSection[];
  };
  is_published: boolean;
};

function safeUrl(value?: string) {
  if (!value) return null;

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? value
      : null;
  } catch {
    return null;
  }
}

async function getPage(slug: string): Promise<SitePage | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Website page service is not configured.");
  }

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/site_pages?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=id,slug,title,page_data,is_published&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not retrieve website page.");
  }

  const data = await response.json();

  return data[0] || null;
}

function SectionRenderer({ section }: { section: SiteSection }) {
  const heading = section.heading || "";
  const text = section.text || "";
  const imageUrl = safeUrl(section.imageUrl);
  const buttonUrl = safeUrl(section.buttonUrl);

  const button = buttonUrl && section.buttonText ? (
    <a
      href={buttonUrl}
      className="mt-6 inline-block rounded-lg bg-[#98703e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#79582e]"
    >
      {section.buttonText}
    </a>
  ) : null;

  switch (section.type) {
    case "hero":
      return (
        <section
          className="flex min-h-[420px] items-center rounded-xl bg-cover bg-center px-8 py-16 text-white sm:px-14"
          style={{
            backgroundImage: imageUrl
              ? `linear-gradient(#0007,#0007),url("${imageUrl}")`
              : "linear-gradient(120deg,#29251f,#98703e)",
          }}
        >
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold sm:text-6xl">
              {heading}
            </h1>
            {text && (
              <p className="mt-5 max-w-xl whitespace-pre-wrap text-base leading-8">
                {text}
              </p>
            )}
            {button}
          </div>
        </section>
      );

    case "text":
      return (
        <section className="mx-auto max-w-4xl px-5 py-12">
          <h2 className="text-3xl font-semibold">{heading}</h2>
          <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-[#746b60]">
            {text}
          </p>
          {button}
        </section>
      );

    case "image":
    case "gallery":
      return (
        <section className="mx-auto max-w-6xl px-5 py-10">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={heading || "Seraya Airways"}
              className="max-h-[550px] w-full rounded-xl object-cover"
            />
          )}
          {heading && (
            <h2 className="mt-6 text-3xl font-semibold">{heading}</h2>
          )}
          {text && (
            <p className="mt-3 whitespace-pre-wrap leading-8 text-[#746b60]">
              {text}
            </p>
          )}
          {button}
        </section>
      );

    case "destinations":
      return (
        <section className="bg-[#f5f0e7] px-5 py-16 text-center">
          <h2 className="text-3xl font-semibold">{heading}</h2>
          {text && (
            <p className="mx-auto mt-4 max-w-2xl whitespace-pre-wrap leading-8 text-[#746b60]">
              {text}
            </p>
          )}
          {button}
        </section>
      );

    case "booking":
      return (
        <section className="rounded-xl bg-[#29251f] px-6 py-14 text-center text-white">
          <h2 className="text-3xl font-semibold">{heading || "Ready to fly?"}</h2>
          {text && (
            <p className="mx-auto mt-4 max-w-xl whitespace-pre-wrap leading-7 text-white/75">
              {text}
            </p>
          )}
          <a
            href={buttonUrl || "/flights"}
            className="mt-7 inline-block rounded-lg bg-[#d6ad70] px-7 py-3 font-semibold text-[#29251f]"
          >
            {section.buttonText || "Book a flight"}
          </a>
        </section>
      );

    default:
      return null;
  }
}

export default async function PublishedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page || !page.is_published) {
    notFound();
  }

  const sections = Array.isArray(page.page_data?.sections)
    ? page.page_data.sections
    : [];

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#29251f]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e0d4] bg-white px-6 py-6 sm:px-12">
        <a href="/" className="text-xl font-semibold tracking-[0.2em] text-[#493a2b]">
          SERAYA
          <span className="ml-2 text-xs tracking-[0.3em] text-[#98703e]">
            AIRWAYS
          </span>
        </a>

        <nav className="flex gap-5 text-sm text-[#62584d]">
          <a href="/">Home</a>
          <a href="/flights">Flights</a>
          <a href="/manage-booking">Manage booking</a>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8">
        {sections.map((section, index) => (
          <SectionRenderer
            key={section.id || index}
            section={section}
          />
        ))}

        {sections.length === 0 && (
          <div className="py-24 text-center">
            <h1 className="text-3xl font-semibold">{page.title}</h1>
            <p className="mt-3 text-[#83786b]">
              This page is ready for content.
            </p>
          </div>
        )}
      </div>

      <footer className="mt-16 bg-[#29251f] px-6 py-10 text-center text-sm text-white/70">
        <p className="font-semibold tracking-[0.3em] text-white">
          SERAYA AIRWAYS
        </p>
        <p className="mt-3">© 2026 Seraya Airways</p>
      </footer>
    </main>
  );
}
