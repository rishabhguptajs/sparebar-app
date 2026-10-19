import Link from "next/link";
import { TrackedVideo } from "@/components/tracked-video";
import { Crumbs, SiteShell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqLd, graph } from "@/lib/seo";
import { FREE_TIER } from "@/config/free-tier";

export type Media = {
  /** File name in /public/showcase without the extension. */
  src: string;
  alt: string;
  caption?: string;
  /** Shape of the tile. Defaults to a tall phone photo. */
  ratio?: "tall" | "photo" | "portrait";
  video?: boolean;
};

export type Guide = {
  path: string;
  name: string;
  h1: string;
  intro: string;
  sections: { h: string; p: string[]; list?: string[]; media?: Media[]; cols?: 2 | 3 | 4; after?: string[] }[];
  faq: { q: string; a: string }[];
};

const RATIO = { tall: "aspect-[9/16]", photo: "aspect-[4/5]", portrait: "aspect-[3/4]" } as const;

function MediaGrid({ media, cols = 3 }: { media: Media[]; cols?: 2 | 3 | 4 }) {
  const grid = cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3";
  return (
    <ul className={`mt-6 grid gap-3 sm:gap-4 ${grid}`}>
      {media.map((m) => (
        <li key={m.src}>
          <figure>
            <div className={`overflow-hidden rounded-2xl bg-panel-2 ${RATIO[m.ratio ?? "tall"]}`}>
              {m.video ? (
                <TrackedVideo name={m.src} src={`/showcase/${m.src}.mp4`} poster={`/showcase/${m.src}-poster.webp`} className="size-full object-cover" controls muted loop playsInline preload="none" aria-label={m.alt} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/showcase/${m.src}.webp`} alt={m.alt} loading="lazy" decoding="async" className="size-full object-cover" />
              )}
            </div>
            {m.caption && <figcaption className="mt-2 text-xs leading-snug text-ink-2">{m.caption}</figcaption>}
          </figure>
        </li>
      ))}
    </ul>
  );
}

const slug = (h: string) =>
  h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** A plain, text-first page about one topic people search for. */
export function GuidePage({ guide }: { guide: Guide }) {
  return (
    <SiteShell>
      <JsonLd
        data={graph(
          {
            "@type": "WebPage",
            name: guide.h1,
            url: `https://sparebar.xyz${guide.path}`,
            description: guide.intro,
            isPartOf: { "@id": "https://sparebar.xyz/#website" },
          },
          breadcrumbLd([
            { name: "Sparebar", path: "/" },
            { name: guide.name, path: guide.path },
          ]),
          faqLd(guide.faq),
        )}
      />
      <Crumbs trail={[{ name: "Sparebar", href: "/" }, { name: guide.name }]} />
      <article className="mt-8 max-w-3xl">
        <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-light leading-[1] tracking-[-0.05em]">
          {guide.h1}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-2">{guide.intro}</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link href="/login" className="btn px-7 py-3.5 text-[15px]">
            Start free
          </Link>
          <p className="text-sm text-ink-2">
            {FREE_TIER.credits} free credits. No card.
          </p>
        </div>

        <nav
          aria-label="On this page"
          className="mt-10 flex flex-wrap gap-2 text-sm"
        >
          {guide.sections.map((s) => (
            <a key={s.h} href={`#${slug(s.h)}`} className="btn-ghost px-4 py-2">
              {s.h}
            </a>
          ))}
        </nav>

        {guide.sections.map((s) => (
          <section key={s.h} id={slug(s.h)} className="mt-14 scroll-mt-8">
            <h2 className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">
              {s.h}
            </h2>
            {s.p.map((t) => (
              <p key={t} className="mt-4 leading-relaxed text-ink-2">
                {t}
              </p>
            ))}
            {s.list && (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-2">
                {s.list.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            {s.media && <MediaGrid media={s.media} cols={s.cols} />}
            {s.after?.map((t) => (
              <p key={t} className="mt-4 leading-relaxed text-ink-2">
                {t}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-16">
          <h2 className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">
            Questions
          </h2>
          <dl className="mt-6 divide-y divide-line rounded-2xl bg-panel px-5">
            {guide.faq.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-lg tracking-[-0.01em]">{f.q}</dt>
                <dd className="mt-2 leading-relaxed text-ink-2">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-panel p-8">
          <div>
            <p className="text-2xl font-light tracking-[-0.03em]">
              Make the first one.
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {FREE_TIER.credits} free credits. No card.
            </p>
          </div>
          <Link href="/login" className="btn px-7 py-3.5 text-[15px]">
            Start free
          </Link>
        </div>

        <nav aria-label="More guides" className="mt-10 flex flex-wrap gap-2 text-sm">
          <Link href="/consistent-character-ai" className="btn-ghost px-4 py-2">Consistency</Link>
          <Link href="/features" className="btn-ghost px-4 py-2">Every feature</Link>
          <Link href="/ai-product-ads" className="btn-ghost px-4 py-2">Product ads</Link>
        </nav>

        <p className="mt-6 text-ink-2">
          See every{" "}
          <Link
            href="/models"
            className="text-ink underline underline-offset-4"
          >
            image and video model
          </Link>{" "}
          and the{" "}
          <Link
            href="/pricing"
            className="text-ink underline underline-offset-4"
          >
            pricing
          </Link>
          .
        </p>
      </article>
    </SiteShell>
  );
}
