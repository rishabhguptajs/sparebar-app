import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs, SiteShell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { FREE_TIER } from "@/config/free-tier";
import { PACKS, PLANS, perCredit } from "@/config/plans";
import { abs, breadcrumbLd, faqLd, graph, usd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing: credits for AI images and videos",
  description: `Sparebar plans start at $15 for 170 credits and packs at $10 for 110. Credits work on every model, failed generations are refunded, and new accounts get ${FREE_TIER.credits} free credits.`,
  alternates: { canonical: "/pricing" },
};

const faq = [
  {
    q: "How much does Sparebar cost?",
    a: `Plans start at $15 a month for 170 credits. Credit packs start at $10 for 110 credits. New accounts get ${FREE_TIER.credits} free credits, no card needed.`,
  },
  {
    q: "Do credits expire?",
    a: `Credits you buy do not expire. Free credits expire after ${FREE_TIER.expiresDays} days.`,
  },
  {
    q: "What does one credit buy?",
    a: "An image on the lowest cost model costs 2 credits. Video costs more and depends on the model, resolution and length. The cost shows before every generation.",
  },
  {
    q: "Are failed generations charged?",
    a: "No. Credits for a failed generation come back to your balance automatically.",
  },
];

export default function Pricing() {
  const row = (p: (typeof PLANS)[number]) => (
    <tr key={p.key}>
      <td className="py-3">{p.label}</td>
      <td className="py-3 tabular-nums">{p.credits}</td>
      <td className="py-3 tabular-nums">${perCredit(p).toFixed(3)}</td>
      <td className="py-3 text-right tabular-nums">{usd(p.priceUsdCents)}</td>
    </tr>
  );
  const head = (first: string) => (
    <thead>
      <tr className="border-b border-line text-ink-2">
        <th className="py-2 font-normal">{first}</th>
        <th className="py-2 font-normal">Credits</th>
        <th className="py-2 font-normal">Per credit</th>
        <th className="py-2 text-right font-normal">Price (USD)</th>
      </tr>
    </thead>
  );
  return (
    <SiteShell>
      <JsonLd
        data={graph(
          {
            "@type": "WebPage",
            name: "Sparebar pricing",
            url: abs("/pricing"),
            isPartOf: { "@id": abs("/#website") },
          },
          breadcrumbLd([
            { name: "Sparebar", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          faqLd(faq),
        )}
      />
      <Crumbs trail={[{ name: "Sparebar", href: "/" }, { name: "Pricing" }]} />
      <h1 className="mt-8 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1] tracking-[-0.05em]">
        Pricing
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
        Pay for credits and use them on any model. Failed generations are
        refunded. Paid credits do not expire. Payments are handled by
        Dodo Payments, which adds any tax at checkout and emails the receipt.
      </p>

      <h2 className="mt-14 text-2xl font-light tracking-[-0.03em] sm:text-3xl">
        Monthly plans
      </h2>
      <ul className="mt-5 grid gap-3 md:grid-cols-3">
        {PLANS.map((p) => (
          <li key={p.key} className="flex flex-col rounded-3xl bg-panel p-6">
            <h3 className="text-sm text-ink-2">{p.label}</h3>
            <p className="mt-4 text-5xl font-light tabular-nums tracking-[-0.05em]">
              {usd(p.priceUsdCents)}
            </p>
            <p className="text-sm text-ink-2">per month</p>
            <p className="mt-6">{p.credits} credits</p>
            <p className="text-sm text-ink-2">
              ${perCredit(p).toFixed(3)} per credit
            </p>
            <p className="mt-2 text-sm text-ink-2">
              About {Math.floor(p.credits / 2)} images on a low cost model.
            </p>
            <Link
              href="/login"
              className="btn-ghost mt-6 px-4 py-3 text-center text-sm"
            >
              Start with {p.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-2">
        Plans are paid month by month. Buy again when you want another month of
        credits.
      </p>

      <h2 className="mt-14 text-2xl font-light tracking-[-0.03em] sm:text-3xl">
        Credit packs
      </h2>
      <table className="mt-5 w-full max-w-3xl text-left text-sm">
        <caption className="sr-only">Credit packs</caption>
        {head("Pack")}
        <tbody className="divide-y divide-line">{PACKS.map(row)}</tbody>
      </table>

      <h2 className="mt-14 text-2xl font-light tracking-[-0.03em] sm:text-3xl">
        Free to try
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
        New accounts get {FREE_TIER.credits} free credits, enough for one image.
        They work on images only and expire after {FREE_TIER.expiresDays} days.{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Start free
        </Link>
      </p>

      <h2 className="mt-14 text-2xl font-light tracking-[-0.03em] sm:text-3xl">
        Questions
      </h2>
      <dl className="mt-6 max-w-3xl divide-y divide-line rounded-2xl bg-panel px-5">
        {faq.map((f) => (
          <div key={f.q} className="py-5">
            <dt className="text-lg tracking-[-0.01em]">{f.q}</dt>
            <dd className="mt-2 leading-relaxed text-ink-2">{f.a}</dd>
          </div>
        ))}
      </dl>
    </SiteShell>
  );
}
