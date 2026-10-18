"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { PACKS, PLANS, STATES, perCredit, type Product } from "@/config/plans";
import { formatMoney, quote } from "@/lib/tax";
import { timeAgo } from "@/lib/ui-types";

type Payment = {
  id: string;
  product_key: string;
  credits: number;
  currency: "USD" | "INR";
  total_minor: number;
  status: string;
  invoice_no: string | null;
  created_at: string;
};
type Activity = { id: number; type: string; amount: number; note: string | null; created_at: string };

type Props = {
  base: string;
  balance: number;
  /** Rupees per dollar, or null when Indian checkout is off. */
  inrPerUsd: number | null;
  sellerStateCode: string | null;
  payments: Payment[];
  activity: Activity[];
  invoiceBase: string;
  demo?: boolean;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open(): void; on(event: string, cb: () => void): void };
  }
}

function loadCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CreditsView({ balance, inrPerUsd, sellerStateCode, payments, activity, invoiceBase, demo }: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inIndia, setInIndia] = useState(false);
  const [stateCode, setStateCode] = useState("");
  const [busy, setBusy] = useState(false);
  // While the payment window is open our modal dialog is closed: an open modal makes the rest of the page inert and covers it.
  const paying = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const q = product
    ? (() => {
        try {
          return quote({ product, inIndia, stateCode, inrPerUsd: inrPerUsd ?? undefined, sellerStateCode: sellerStateCode ?? undefined });
        } catch {
          return null;
        }
      })()
    : null;

  function open(p: Product) {
    setProduct(p);
    setError(null);
    setDone(null);
    dialog.current?.showModal();
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!product || busy) return;
    if (demo) return setError("Payments are off in the preview.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey: product.key, name, phone, inIndia, stateCode: inIndia ? stateCode : undefined }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "Could not start the payment.");
      if (!(await loadCheckout()) || !window.Razorpay) throw new Error("Could not load the payment window. Check your connection and try again.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Sparebar",
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#e5247a" },
        modal: {
          ondismiss: () => {
            paying.current = false;
            setBusy(false);
            if (!dialog.current?.open) dialog.current?.showModal();
          },
        },
        handler: async (r: Record<string, string>) => {
          try {
            const v = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(r),
            });
            const out = await v.json();
            if (!v.ok) throw new Error(out.error ?? "We could not confirm the payment.");
            setDone(out.credits);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "We could not confirm the payment.");
          } finally {
            paying.current = false;
            setBusy(false);
            if (!dialog.current?.open) dialog.current?.showModal();
          }
        },
      });
      rzp.on("payment.failed", () => {
        setError("The payment did not go through. You have not been charged. Try again or use another method.");
        setBusy(false);
      });
      paying.current = true;
      dialog.current?.close();
      rzp.open();
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
          <p className="mt-1 max-w-lg text-sm text-ink-2">
            Every image and video costs credits. If a generation fails, the credits come back automatically.
          </p>
        </div>
        <p className="rounded-2xl bg-panel px-5 py-3">
          <span className="font-display text-4xl font-semibold tabular-nums">{balance}</span>
          <span className="ml-2 text-sm text-ink-2">credits left</span>
        </p>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Monthly plans</h2>
      <p className="mt-1 text-sm text-ink-2">Paid month by month. Buy a plan again whenever you want another month of credits.</p>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <li key={p.key} className="flex flex-col rounded-3xl bg-panel p-6">
            <p className="text-sm font-medium text-ink-2">{p.label}</p>
            <p className="mt-3 font-display text-4xl font-semibold tabular-nums">${p.priceUsdCents / 100}</p>
            <p className="mt-1 text-sm">{p.credits} credits</p>
            <p className="text-xs text-ink-2">${perCredit(p).toFixed(3)} per credit{i === PLANS.length - 1 ? ", the lowest rate" : ""}</p>
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
              <p className="text-xs text-ink-2">${perCredit(p).toFixed(3)} per credit</p>
            </div>
            <button onClick={() => open(p)} className="rounded-xl bg-panel-2 px-4 py-2 text-sm font-semibold tabular-nums hover:bg-line/60">
              ${p.priceUsdCents / 100}
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
              <p className="tabular-nums">{formatMoney(p.total_minor, p.currency)}</p>
              {p.invoice_no && (
                <Link href={`${invoiceBase}/${p.id}`} className="font-medium text-accent hover:underline" target="_blank">
                  Invoice
                </Link>
              )}
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
          if (paying.current) return;
          setBusy(false);
          setError(null);
        }}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-3xl border border-line bg-panel p-0"
      >
        {product && done === null && (
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

            <div className="space-y-2">
              <label htmlFor="b-name" className="text-sm font-medium">
                Full name
              </label>
              <input id="b-name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="b-phone" className="text-sm font-medium">
                Phone number
              </label>
              <input
                id="b-phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+1 555 010 0199"
                className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm"
              />
              <p className="text-xs text-ink-2">Your card network needs a real number to approve the payment.</p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Where are you paying from?</legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: false, label: "Outside India" },
                  { v: true, label: "India" },
                ].map((o) => (
                  <label
                    key={o.label}
                    className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm ${
                      inIndia === o.v ? "border-accent" : "border-line text-ink-2"
                    } ${o.v && !inrPerUsd ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <input
                      type="radio"
                      name="where"
                      className="sr-only"
                      checked={inIndia === o.v}
                      disabled={o.v && !inrPerUsd}
                      onChange={() => setInIndia(o.v)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
              {!inrPerUsd && <p className="text-xs text-ink-2">Rupee payments are not available right now.</p>}
            </fieldset>

            {inIndia && (
              <div className="space-y-2">
                <label htmlFor="b-state" className="text-sm font-medium">
                  State
                </label>
                <select
                  id="b-state"
                  required
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm"
                >
                  <option value="">Choose a state</option>
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {q && (
              <dl className="space-y-1.5 rounded-xl bg-panel-2 px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-2">Price</dt>
                  <dd className="tabular-nums">{formatMoney(q.baseMinor, q.currency)}</dd>
                </div>
                {q.currency === "INR" && (
                  <div className="flex justify-between">
                    <dt className="text-ink-2">GST 18%</dt>
                    <dd className="tabular-nums">{formatMoney(q.gstMinor, q.currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatMoney(q.totalMinor, q.currency)}</dd>
                </div>
              </dl>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              disabled={busy || !q}
              className="w-full rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink disabled:opacity-40"
            >
              {busy ? "Waiting for payment" : q ? `Pay ${formatMoney(q.totalMinor, q.currency)}` : "Pay"}
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

        {done !== null && (
          <div className="space-y-4 p-8 text-center">
            <p className="font-display text-3xl font-semibold">{done} credits added</p>
            <p className="text-sm text-ink-2">Your invoice is under Payments on this page.</p>
            <button onClick={() => dialog.current?.close()} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
              Done
            </button>
          </div>
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
