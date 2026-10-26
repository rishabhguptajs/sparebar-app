"use client";

import { track } from "@/components/analytics";
import Link from "next/link";
import { useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { REFERRAL } from "@/config/referral";
import { PACKS, PLANS, perCredit, type Product } from "@/config/plans";
import { timeAgo } from "@/lib/ui-types";

type Payment = {
  id: string;
  product_key: string;
  credits: number;
  total_minor: number;
  status: string;
  created_at: string;
};
type Activity = { id: number; type: string; amount: number; note: string | null; created_at: string };

type Props = {
  base: string;
  balance: number;
  payments: Payment[];
  activity: Activity[];
  friendDiscount?: boolean;
  demo?: boolean;
};

export function CreditsView({ balance, payments, activity, friendDiscount, demo }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = (p: Product) => `$${p.priceUsdCents / 100}`;
  const rate = (p: Product) => `$${perCredit(p).toFixed(3)}`;

  function open(p: Product) {
    track("plan_clicked", { product: p.key, credits: p.credits });
    setProduct(p);
    setError(null);
    dialog.current?.showModal();
  }

  // Dodo hosts the payment page. The credits arrive when its webhook confirms the payment.
  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!product || busy) return;
    if (demo) return setError("Payments are off in the preview.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey: product.key }),
      });
      const out = await res.json();
      if (!res.ok || !out.url) throw new Error(out.error ?? "Could not start the payment.");
      track("checkout_opened", { product: product.key, credits: product.credits, currency: "USD" });
      window.location.href = out.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Credits</h1>
          </div>
        <p className="rounded-2xl bg-panel px-5 py-3">
          <span className="font-display text-4xl font-semibold tabular-nums">{balance}</span>
          <span className="ml-2 text-sm text-ink-2">credits left</span>
        </p>
      </div>

      {friendDiscount && (
        <p className="mt-6 rounded-2xl bg-panel px-5 py-3 text-sm">
          You were invited by a friend, so your first purchase is {REFERRAL.friendDiscountBp / 100}% off. It is applied at checkout.
        </p>
      )}

      <h2 className="mt-10 font-display text-xl font-semibold">Monthly plans</h2>
      <p className="mt-1 text-sm text-ink-2">Paid month by month. Buy a plan again whenever you want another month of credits.</p>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <li key={p.key} className="flex flex-col rounded-3xl bg-panel p-6">
            <p className="text-sm font-medium text-ink-2">{p.label}</p>
            <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{price(p)}</p>
            <p className="mt-1 text-sm">{p.credits} credits</p>
            <p className="text-xs text-ink-2">{rate(p)} per credit{i === PLANS.length - 1 ? ", the lowest rate" : ""}</p>
            <button
              onClick={() => open(p)}
              className="mt-6 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink"
            >
              Buy {p.label}
            </button>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-xl font-semibold">One-time packs</h2>
      <p className="mt-1 text-sm text-ink-2">Top up without a plan. Credits do not expire.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {PACKS.map((p) => (
          <li key={p.key} className="flex items-center justify-between gap-3 rounded-2xl bg-panel p-4">
            <div>
              <p className="text-sm font-medium">{p.credits} credits</p>
              <p className="text-xs text-ink-2">{rate(p)} per credit</p>
            </div>
            <button onClick={() => open(p)} className="rounded-xl bg-panel-2 px-4 py-2 text-sm font-semibold tabular-nums hover:bg-line/60">
              {price(p)}
            </button>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 font-display text-xl font-semibold">Payments</h2>
      {payments.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">No payments yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-panel">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.credits} credits</p>
                <p className="text-xs text-ink-2">
                  {timeAgo(p.created_at)}
                  {p.status === "refunded" ? " · Refunded" : ""}
                </p>
              </div>
              <p className="tabular-nums">${(p.total_minor / 100).toFixed(2)}</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 font-display text-xl font-semibold">Activity</h2>
      {activity.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Nothing yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-panel">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <div>
                <p>{describe(a)}</p>
                <p className="text-xs text-ink-2">{timeAgo(a.created_at)}</p>
              </div>
              <p className={`tabular-nums font-medium ${a.amount > 0 ? "text-ok" : ""}`}>
                {a.amount > 0 ? "+" : ""}
                {a.amount}
              </p>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        onClose={() => {
          setBusy(false);
          setError(null);
        }}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-3xl border border-line bg-panel p-0"
      >
        {product && (
          <form onSubmit={pay} className="space-y-5 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {product.kind === "plan" ? `${product.label} plan` : `${product.credits} credits`}
                </h2>
                <p className="mt-1 text-sm text-ink-2">{product.credits} credits added right after payment.</p>
              </div>
              <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="rounded-lg p-1.5 text-ink-2 hover:bg-panel-2">
                <CloseIcon />
              </button>
            </div>

            <dl className="space-y-1.5 rounded-xl bg-panel-2 px-4 py-3 text-sm">
              <div className="flex justify-between font-semibold">
                <dt>Price</dt>
                <dd className="tabular-nums">{price(product)}</dd>
              </div>
              <p className="text-xs text-ink-2">Any tax is added on the payment page, which is hosted by Dodo Payments.</p>
            </dl>

            {error && (
              <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <button disabled={busy} className="w-full rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink disabled:opacity-40">
              {busy ? "Opening payment page" : `Pay ${price(product)}`}
            </button>
            <p className="text-center text-xs text-ink-2">
              By paying you agree to the{" "}
              <Link href="/terms" className="underline" target="_blank">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/refunds" className="underline" target="_blank">
                refund policy
              </Link>
              .
            </p>
          </form>
        )}
      </dialog>
    </div>
  );
}

function describe(a: Activity) {
  switch (a.type) {
    case "grant":
      if (a.note?.includes("signup")) return "Welcome credits";
      return a.note?.includes("pay:") ? "Credits purchased" : "Credits added";
    case "reserve":
      return "Used for a generation";
    case "refund":
      return "Returned after a failed generation";
    case "expire":
      return a.note === "refunded payment" ? "Removed after a payment refund" : "Credits expired";
    default:
      return a.type;
  }
}
