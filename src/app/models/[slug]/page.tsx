import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, SiteShell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { FREE_TIER } from "@/config/free-tier";
import { abs, breadcrumbLd, catalog, faqLd, findModel, graph } from "@/lib/seo";

type Params = { slug: string };

export const dynamicParams = false;
export const generateStaticParams = () =>
  catalog().map((m) => ({ slug: m.key }));

const noun = (kind: "image" | "video") =>
  kind === "video" ? "video" : "image";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const m = findModel((await params).slug);
  if (!m) return {};
  return {
    title: `${m.label} AI ${noun(m.kind)} generator`,
    description: `Use ${m.label} by ${m.maker} to make UGC style ${noun(m.kind)}s of your own character. ${m.blurb} From ${m.credits} credits, with the cost shown before you run it.`,
    alternates: { canonical: `/models/${m.key}` },
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const m = findModel((await params).slug);
  if (!m) notFound();
  const others = catalog()
    .filter((o) => o.kind === m.kind && o.key !== m.key)
    .slice(0, 6);
  const faq = [
    {
      q: `What is ${m.label}?`,
      a: `${m.label} is an AI ${noun(m.kind)} model from ${m.maker}. ${m.blurb}`,
    },
    {
      q: `How much does ${m.label} cost on Sparebar?`,
      a: `It starts at ${m.credits} credits per ${noun(m.kind)}. The exact cost for your resolution${m.kind === "video" ? " and length" : ""} shows before you run it, and failed generations are refunded.`,
    },
    {
      q: `Can I use ${m.label} with my own character?`,
      a: `Yes. Save a character with up to three photos, then pick it and ${m.label} in the studio.${m.kind === "video" ? " The character photo is used as the start of the video." : ""}`,
    },
    ...(m.freeEligible
      ? [
          {
            q: `Can I try ${m.label} for free?`,
            a: `Yes. New accounts get ${FREE_TIER.credits} free credits, which cover one ${m.label} ${noun(m.kind)}.`,
          },
        ]
      : []),
  ];
  return (
    <SiteShell>
      <JsonLd
        data={graph(
          {
            "@type": "WebPage",
            name: `${m.label} AI ${noun(m.kind)} generator`,
            url: abs(`/models/${m.key}`),
            description: m.blurb,
            isPartOf: { "@id": abs("/#website") },
            about: { "@type": "Thing", name: m.label },
          },
          breadcrumbLd([
            { name: "Sparebar", path: "/" },
            { name: "Models", path: "/models" },
            { name: m.label, path: `/models/${m.key}` },
          ]),
          faqLd(faq),
        )}
      />
      <Crumbs
        trail={[
          { name: "Sparebar", href: "/" },
          { name: "Models", href: "/models" },
          { name: m.label },
        ]}
      />
      <article className="mt-8 max-w-3xl">
        <p className="text-sm text-ink-2">
          {m.maker}, {noun(m.kind)} model
        </p>
        <h1 className="mt-2 text-4xl font-light leading-[1.05] tracking-[-0.045em] sm:text-6xl">
          {m.label} AI {noun(m.kind)} generator
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-2">
          {m.blurb} Use {m.label} in Sparebar to make UGC style {noun(m.kind)}s
          of a character you saved, from {m.credits} credits.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link href="/login" className="btn px-7 py-3.5 text-[15px]">
            Start free
          </Link>
          <p className="text-sm text-ink-2">
            {FREE_TIER.credits} free credits. No card.
          </p>
        </div>

        {m.tags.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">
              What it can do
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {m.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-2"
                >
                  {t}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-14">
          <h2 className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">
            {m.label} credit cost
          </h2>
          {m.options.length > 1 ? (
            <table className="mt-5 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-2">
                  <th className="py-2 font-normal">Resolution</th>
                  {m.kind === "video" && (
                    <th className="py-2 font-normal">Length</th>
                  )}
                  <th className="py-2 text-right font-normal">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {m.options.map((o) => (
                  <tr key={o.value}>
                    <td className="py-3">{o.value}</td>
                    {m.kind === "video" && (
                      <td className="py-3">{o.seconds} seconds</td>
                    )}
                    <td className="py-3 text-right tabular-nums">
                      {o.credits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-4 text-ink-2">
              One {noun(m.kind)} costs {m.credits} credits.
            </p>
          )}
          {m.durations.length > 0 && (
            <p className="mt-4 text-sm text-ink-2">
              Lengths offered: {m.durations.join(", ")} seconds. Longer clips
              cost more.
            </p>
          )}
          <p className="mt-4 text-sm text-ink-2">
            Failed generations are refunded to your balance automatically.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">
            Questions about {m.label}
          </h2>
          <dl className="mt-6 divide-y divide-line border-y border-line">
            {faq.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-lg tracking-[-0.01em]">{f.q}</dt>
                <dd className="mt-2 leading-relaxed text-ink-2">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">
            Other {noun(m.kind)} models
          </h2>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
            {others.map((o) => (
              <li key={o.key} className="border-b border-line py-3">
                <Link
                  href={`/models/${o.key}`}
                  className="flex justify-between gap-4 hover:text-accent"
                >
                  <span>{o.label}</span>
                  <span className="text-sm tabular-nums text-ink-2">
                    {o.credits} credits
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-ink-2">
            <Link
              href="/models"
              className="text-ink underline underline-offset-4"
            >
              All models
            </Link>
          </p>
        </section>
      </article>
    </SiteShell>
  );
}
