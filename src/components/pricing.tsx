"use client";

import Link from "next/link";
import { useState } from "react";
import { PACKS, PLANS, perCredit, type Product } from "@/config/plans";

export type Region = "IN" | "OTHER";

// Rupees for visitors in India, dollars for everyone else. The starting region comes from the server.
export function Pricing({ initialRegion, gstRegistered }: { initialRegion: Region; gstRegistered: boolean }) {
  const [region, setRegion] = useState<Region>(initialRegion);
  const india = region === "IN";
  const price = (p: Product) => (india ? `₹${p.priceInr.toLocaleString("en-IN")}` : `$${p.priceUsdCents / 100}`);
  const rate = (p: Product) => (india ? `₹${(p.priceInr / p.credits).toFixed(2)}` : `$${perCredit(p).toFixed(3)}`);

  return (
    <>
      <ul className="mt-14 grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
        {PLANS.map((p) => (
          <li key={p.key} className="flex flex-col py-8 md:px-8 md:first:pl-0 md:last:pr-0">
            <h3 className="text-sm text-ink-2">{p.label}</h3>
            <p className="mt-6 text-7xl font-light tabular-nums tracking-[-0.06em]">{price(p)}</p>
            <p className="mt-1 text-sm text-ink-2">per month</p>
            <p className="mt-8">{p.credits} credits</p>
            <p className="text-sm text-ink-2">{rate(p)} per credit</p>
            <Link href="/login" className="btn-ghost mt-8 px-4 py-3 text-center text-sm">
              Start with {p.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-2">Plans are paid month by month. Buy again when you want another month of credits.</p>

      <h3 className="mt-20 text-2xl font-light tracking-[-0.03em]">Or top up when you need to</h3>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {PACKS.map((p) => (
          <li key={p.key} className="flex items-baseline justify-between gap-4 py-5">
            <p>
              {p.credits} credits
              <span className="ml-4 text-sm text-ink-2">{rate(p)} per credit</span>
            </p>
            <p className="text-2xl font-light tabular-nums tracking-[-0.03em]">{price(p)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink-2">
        {india ? (gstRegistered ? "Prices are in rupees, plus GST." : "Prices are in rupees.") : "Prices are in US dollars."}{" "}
        <button type="button" onClick={() => setRegion(india ? "OTHER" : "IN")} className="underline underline-offset-4 hover:text-ink">
          {india ? "Not in India?" : "In India?"}
        </button>
      </p>
    </>
  );
}
