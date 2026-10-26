"use client";

import { useState } from "react";
import { track } from "@/components/analytics";
import { REFERRAL } from "@/config/referral";
import { useRefreshData } from "@/lib/queries";
import type { ReferralSummary } from "@/lib/referral";
import { PayoutDetails } from "@/lib/payout-details";
import { timeAgo } from "@/lib/ui-types";

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const field = "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm";
const METHODS = [
  { key: "credits", label: "Credits (instant, worth more)" },
  { key: "upi", label: "UPI (India)" },
  { key: "bank", label: "Bank transfer (India)" },
  { key: "wise", label: "Wise" },
] as const;
const PAYOUT_LABEL: Record<string, string> = { credits: "credits", upi: "UPI", bank: "bank transfer", wise: "Wise" };

export function ReferralsView({ data, demo }: { data: ReferralSummary; demo?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("credits");
  const [upiId, setUpiId] = useState("");
  const [wiseEmail, setWiseEmail] = useState("");
  const [bank, setBank] = useState({ holder: "", accountNumber: "", confirm: "", ifsc: "", bankName: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const refresh = useRefreshData();

  async function copy() {
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      track("referral_link_copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ ok: false, text: "Could not copy. Select the link and copy it." });
    }
  }

  async function requestPayout(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (demo) return setMessage({ ok: false, text: "Payouts are off in the preview." });
    const details =
      method === "upi"
        ? { method, upiId }
        : method === "wise"
          ? { method, email: wiseEmail }
          : method === "bank"
            ? { method, holder: bank.holder, accountNumber: bank.accountNumber, ifsc: bank.ifsc, bankName: bank.bankName || undefined }
            : { method };
    if (method === "bank" && bank.accountNumber.trim() !== bank.confirm.trim()) return setMessage({ ok: false, text: "The two account numbers do not match." });
    const checked = PayoutDetails.safeParse(details);
    if (!checked.success) return setMessage({ ok: false, text: checked.error.issues[0]?.message ?? "Check the payout details." });
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/referral/payout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(checked.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not request the payout.");
      track("payout_requested", { amount_cents: data.availableCents, method });
      setUpiId("");
      setWiseEmail("");
      setBank({ holder: "", accountNumber: "", confirm: "", ifsc: "", bankName: "" });
      setMessage({
        ok: true,
        text: body.credits ? "Done. The credits are in your balance." : "Payout requested. We pay by hand, usually within a few days.",
      });
      refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not request the payout." });
    } finally {
      setBusy(false);
    }
  }

  const asCredits = method === "credits";
  const min = asCredits ? data.minCreditPayoutCents : data.minPayoutCents;
  const creditCount = Math.floor((data.availableCents / 100) * data.creditsPerDollar);
  const canRequest = data.availableCents >= min && (asCredits || !data.openPayout);
  const stats = [
    { label: "Friends joined", value: String(data.referred) },
    { label: "Paying", value: String(data.paying) },
    { label: "Available", value: usd(data.availableCents) },
    { label: "On hold", value: usd(data.pendingCents) },
    { label: "Paid out", value: usd(data.paidCents) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-10 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Refer and earn</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-2">
        Share your link. When a friend signs up and buys credits, you earn {REFERRAL.share * 100}% of what they pay, on every purchase for{" "}
        {REFERRAL.windowMonths} months. They get {REFERRAL.friendDiscountBp / 100}% off their first purchase.
      </p>

      <div className="mt-6 rounded-3xl bg-panel p-5">
        <p className="text-sm font-medium">Your link</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input readOnly value={data.link} onFocus={(e) => e.currentTarget.select()} aria-label="Your referral link" className={`${field} min-w-0 flex-1`} />
          <button onClick={copy} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-2">Your code is {data.code}. Anyone who opens this link and signs up within {REFERRAL.cookieDays} days counts as your referral.</p>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label} className="rounded-2xl bg-panel p-4">
            <p className="font-display text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-xs text-ink-2">{s.label}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-2">Earnings are on hold for {REFERRAL.holdDays} days in case of a refund, then become available.</p>

      <h2 className="mt-10 font-display text-xl font-semibold">Get paid</h2>
      {data.openPayout && !asCredits ? (
        <p className="mt-2 rounded-2xl bg-panel px-5 py-3 text-sm">
          Your payout of {usd(data.openPayout.amountCents)} was requested {timeAgo(data.openPayout.createdAt)} and is waiting to be paid.
        </p>
      ) : (
        <form onSubmit={requestPayout} className="mt-3 space-y-4 rounded-3xl bg-panel p-5">
          <p className="text-sm text-ink-2">
            You have {usd(data.availableCents)} available. Cash needs {usd(data.minPayoutCents)}; credits only {usd(data.minCreditPayoutCents)}, and
            you get {Math.round(data.creditsPerDollar)} credits for every $1 earned.
          </p>
          <div className="space-y-2">
            <label htmlFor="p-method" className="text-sm font-medium">
              How should we pay you?
            </label>
            <select id="p-method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={field}>
              {METHODS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          {method === "upi" && (
            <div className="space-y-2">
              <label htmlFor="p-upi" className="text-sm font-medium">
                UPI ID
              </label>
              <input id="p-upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@bank" maxLength={120} autoComplete="off" className={field} />
            </div>
          )}
          {method === "wise" && (
            <div className="space-y-2">
              <label htmlFor="p-wise" className="text-sm font-medium">
                Email on your Wise account
              </label>
              <input id="p-wise" type="email" value={wiseEmail} onChange={(e) => setWiseEmail(e.target.value)} maxLength={200} autoComplete="off" className={field} />
            </div>
          )}
          {method === "bank" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="p-holder" className="text-sm font-medium">
                  Name on the account
                </label>
                <input id="p-holder" value={bank.holder} onChange={(e) => setBank({ ...bank, holder: e.target.value })} maxLength={100} autoComplete="off" className={field} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="p-acct" className="text-sm font-medium">
                    Account number
                  </label>
                  <input id="p-acct" inputMode="numeric" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, "") })} maxLength={18} autoComplete="off" className={field} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="p-acct2" className="text-sm font-medium">
                    Confirm account number
                  </label>
                  <input id="p-acct2" inputMode="numeric" value={bank.confirm} onChange={(e) => setBank({ ...bank, confirm: e.target.value.replace(/\D/g, "") })} maxLength={18} autoComplete="off" onPaste={(e) => e.preventDefault()} className={field} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="p-ifsc" className="text-sm font-medium">
                    IFSC code
                  </label>
                  <input id="p-ifsc" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} placeholder="HDFC0001234" maxLength={11} autoComplete="off" className={field} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="p-bank" className="text-sm font-medium">
                    Bank name <span className="text-ink-2">(optional)</span>
                  </label>
                  <input id="p-bank" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} maxLength={100} autoComplete="off" className={field} />
                </div>
              </div>
              <p className="text-xs text-ink-2">Only used to send your payout. Check it twice: a wrong account number can send money to someone else.</p>
            </div>
          )}
          <button
            disabled={!canRequest || busy}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50"
          >
            {busy ? "Working..." : asCredits ? `Get ${creditCount} credits` : `Request ${usd(data.availableCents)}`}
          </button>
        </form>
      )}
      {message && (
        <p role="status" className={`mt-3 text-sm ${message.ok ? "text-ink-2" : "text-danger"}`}>
          {message.text}
        </p>
      )}

      <h2 className="mt-10 font-display text-xl font-semibold">Earnings</h2>
      {data.earnings.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">Nothing yet. You earn when a friend you referred buys credits.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-2xl bg-panel">
          {data.earnings.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                {e.note ?? "Purchase by a friend"}
                <span className="ml-2 text-xs text-ink-2">{timeAgo(e.createdAt)}</span>
              </span>
              <span className={`tabular-nums ${e.status === "reversed" ? "text-ink-2 line-through" : ""}`}>
                {e.amountCents < 0 ? "-" : "+"}
                {usd(Math.abs(e.amountCents))}
                {e.status === "reversed" && <span className="ml-2 text-xs no-underline">refunded</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {data.payouts.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl font-semibold">Payouts</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl bg-panel">
            {data.payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  {usd(p.amountCents)} as {PAYOUT_LABEL[p.method] ?? p.method}
                  <span className="ml-2 text-xs text-ink-2">{timeAgo(p.createdAt)}</span>
                </span>
                <span className="text-xs capitalize text-ink-2">{p.status === "requested" ? "waiting" : p.status}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-10 text-xs text-ink-2">
        Earnings are {REFERRAL.share * 100}% of the amount your friend pays after the payment fee. Purchases that are refunded do not count. Accounts that
        sign up with the same device or network as yours do not count either. You are responsible for any taxes on what you earn.
      </p>
    </div>
  );
}
