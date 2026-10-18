import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs, SiteShell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { PRODUCTS, perCredit } from "@/config/plans";
import { abs, breadcrumbLd, catalog, graph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI image and video models for UGC",
  description:
    "Every AI image and video model in Sparebar with its credit cost: Seedance, Kling, Veo, Wan, Nano Banana, Seedream, FLUX and more. Compare and pick the right one.",
  alternates: { canonical: "/models" },
};

export default function Models() {
  const all = catalog();
  const videos = all.filter((m) => m.kind === "video");
  const images = all.filter((m) => m.kind === "image");
  const cheapest = Math.min(...PRODUCTS.map(perCredit));
  const group = (title: string, list: typeof all) => (
    <section className="mt-14">
      <h2 className="text-2xl font-light tracking-[-0.03em] sm:text-3xl">
        {title}
      </h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {list.map((m) => (
          <li key={m.key}>
            <Link
              href={`/models/${m.key}`}
              className="grid gap-1 py-4 hover:bg-ink/[0.03] sm:grid-cols-[1fr_2fr_auto] sm:items-baseline sm:gap-6"
            >
              <span className="text-lg tracking-[-0.01em]">{m.label}</span>
              <span className="text-sm text-ink-2">
                {m.maker}. {m.blurb}
              </span>
              <span className="text-sm tabular-nums text-ink-2">
                from {m.credits} credits
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <SiteShell>
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            name: "AI image and video models",
            url: abs("/models"),
            isPartOf: { "@id": abs("/#website") },
          },
          breadcrumbLd([
            { name: "Sparebar", path: "/" },
            { name: "Models", path: "/models" },
          ]),
          {
            "@type": "ItemList",
            itemListElement: all.map((m, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: m.label,
              url: abs(`/models/${m.key}`),
            })),
          },
        )}
      />
      <Crumbs trail={[{ name: "Sparebar", href: "/" }, { name: "Models" }]} />
      <h1 className="mt-8 max-w-3xl text-4xl font-light leading-[1.05] tracking-[-0.045em] sm:text-6xl">
        AI image and video models
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
        Sparebar runs {all.length} models in one place. Each has a fixed credit
        cost shown before you run it, and credits cost as little as $
        {cheapest.toFixed(3)} each on the best plan. Models that accept
        reference photos work with your saved characters.
      </p>
      {group(`Video models (${videos.length})`, videos)}
      {group(`Image models (${images.length})`, images)}
    </SiteShell>
  );
}
