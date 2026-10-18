import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs, SiteShell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { MakerMark } from "@/components/maker-mark";
import { tierFor } from "@/config/model-meta";
import { PRODUCTS, perCredit } from "@/config/plans";
import {
  abs,
  breadcrumbLd,
  catalog,
  graph,
  type CatalogModel,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI image and video models for UGC",
  description:
    "Every AI image and video model in Sparebar with its credit cost: Seedance, Kling, Veo, Wan, Nano Banana, Seedream, FLUX and more. Compare and pick the right one.",
  alternates: { canonical: "/models" },
};

const TIER = {
  budget: "Low cost",
  standard: "Mid",
  premium: "Premium",
} as const;

function Row({ m }: { m: CatalogModel }) {
  return (
    <li>
      <Link
        href={`/models/${m.key}`}
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-2xl px-3 py-4 transition-colors hover:bg-panel focus-visible:bg-panel sm:grid-cols-[auto_12rem_minmax(0,1fr)_6.5rem] sm:px-4"
      >
        <MakerMark
          maker={m.maker}
          className="size-10 row-span-2 sm:row-span-1"
        />
        <span className="min-w-0">
          <span className="block truncate text-lg tracking-[-0.015em]">
            {m.label}
          </span>
          <span className="block text-xs text-ink-2">
            {m.maker}
            {m.sound ? ", with sound" : ""}
          </span>
        </span>
        <span className="col-span-2 col-start-2 text-sm leading-snug text-ink-2 sm:col-span-1 sm:col-start-auto">
          {m.blurb}
        </span>
        <span className="col-start-3 row-start-1 text-right sm:col-start-auto sm:row-start-auto">
          <span className="block text-lg tabular-nums">{m.fromCredits}</span>
          <span className="block text-xs text-ink-2">
            {TIER[tierFor(m.kind, m.fromCredits)]}
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function Models() {
  const all = catalog();
  const videos = all.filter((m) => m.kind === "video");
  const images = all.filter((m) => m.kind === "image");
  const low = Math.min(...all.map((m) => m.fromCredits));
  const cheapest = Math.min(...PRODUCTS.map(perCredit));
  const group = (
    id: string,
    title: string,
    note: string,
    list: CatalogModel[],
  ) => (
    <section id={id} aria-labelledby={`${id}-h`} className="mt-16 scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2 px-3 sm:px-4">
        <h2
          id={`${id}-h`}
          className="text-3xl font-light tracking-[-0.04em] sm:text-4xl"
        >
          {title} <span className="text-ink-2">{list.length}</span>
        </h2>
        <p className="text-sm text-ink-2">{note}</p>
      </div>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {list.map((m) => (
          <Row key={m.key} m={m} />
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
      <h1 className="mt-8 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1] tracking-[-0.05em]">
        AI image and video models
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
        {all.length} models in one place. Every one shows a fixed credit cost
        before you run it, from {low}{" "}
        {low === 1 ? "credit" : "credits"}, and credits cost as little as ${cheapest.toFixed(3)} on the
        best plan. Models that accept reference photos work with your saved
        characters.
      </p>
      <nav aria-label="Jump to" className="mt-8 flex flex-wrap gap-2 text-sm">
        <a href="#video" className="btn-ghost px-4 py-2">
          Video ({videos.length})
        </a>
        <a href="#image" className="btn-ghost px-4 py-2">
          Image ({images.length})
        </a>
        <Link href="/pricing" className="btn-ghost px-4 py-2">
          Pricing
        </Link>
      </nav>
      {group(
        "video",
        "Video",
        "Credits for a default length clip at the lowest resolution.",
        videos,
      )}
      {group(
        "image",
        "Image",
        "Credits per image at the lowest resolution.",
        images,
      )}
    </SiteShell>
  );
}
