"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { assessLab, usd, type LabStat } from "@/lib/labs";
import { TABS, type AdminTab } from "@/lib/admin-tabs";
import { timeAgo } from "@/lib/ui-types";
import { marginFor, OPENROUTER_TOPUP_FEE, PAYMENT_FEE_RATE, TARGET_MARGIN, type MarginRow } from "@/lib/margin";

type Props = {
  base: string;
  labs: LabStat[];
  margins: MarginRow[];
  days: number | null;
  modelNames: Record<string, string>;
  free: { reason: string; count: number }[];
  payments: { currency: string; count: number; total_minor: number }[];
  signups: { total: number; today: number; week: number; month: number };
  users: { id: string; email: string | null; country: string | null; created_at: string; balance: number; jobs: number; paid: boolean }[];
  recentPayments: { email: string | null; credits: number; total_minor: number; status: string; created_at: string }[];
  referrers?: { id: string; email: string | null; referred: number; earnedCents: number; flagged: boolean }[];
  payouts?: { id: string; email: string | null; amountCents: number; method: string; destination: string; status: string; note: string | null; createdAt: string; flagged: boolean }[];
  tab: AdminTab;
  demo?: boolean;
};

const LEVELS = {
  ok: { label: "Healthy", cls: "text-ok" },
  low: { label: "Running low", cls: "text-accent" },
  empty: { label: "Used up", cls: "text-danger" },
  billing_error: { label: "Billing error", cls: "text-danger" },
  unknown: { label: "No balance recorded", cls: "text-ink-2" },
} as const;

const REASONS: Record<string, string> = {
  granted: "Granted",
  device_used: "Refused: device already claimed",
  email_used: "Refused: email already claimed",
  ip_limit: "Refused: too many from one network",
  disposable: "Refused: disposable email",
  paused: "Refused: free credits paused",
};

/** Only the labs that serve models now. The old direct adapters stay in code as fallbacks but need no tracking. */
const ACTIVE_LABS = ["openrouter", "google"];

export function AdminView({
  base,
  labs,
  margins,
  days,
  modelNames,
  free,
  payments,
  signups,
  users,
  recentPayments,
  referrers = [],
  payouts = [],
  tab: initialTab,
  demo,
}: Props) {
  const [tab, setTab] = useState<AdminTab>(initialTab);
  // The address follows the tab so a reload or a shared link lands on the same one, without asking the server again.
  function pick(key: AdminTab) {
    setTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState(null, "", url);
  }
  const shown = ACTIVE_LABS.flatMap((l) => labs.filter((s) => s.lab === l));
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Admin
      </h1>

      <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-line pb-4" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => pick(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-accent text-accent-ink" : "text-ink-2 hover:bg-panel hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
        <Link href={`${base}/admin/avatars`} className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-ink-2 hover:bg-panel hover:text-ink">
          Avatars
        </Link>
      </nav>

      <div className="mt-8 [&>:first-child]:!mt-0">
        {tab === "overview" && (
          <>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Users", v: signups.total },
          { l: "Last day", v: signups.today },
          { l: "Last 7 days", v: signups.week },
          { l: "Last 30 days", v: signups.month },
        ].map((c) => (
          <li key={c.l} className="rounded-2xl bg-panel p-5">
            <p className="text-sm text-ink-2">{c.l}</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{c.v}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="font-display text-xl font-semibold">
            Free credits, last 30 days
          </h2>
          {free.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">No signups yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-panel text-sm">
              {free.map((f) => (
                <li key={f.reason} className="flex justify-between px-4 py-3">
                  <span>{REASONS[f.reason] ?? f.reason}</span>
                  <span className="tabular-nums">{f.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">
            Payments, last 30 days
          </h2>
          {payments.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">No paid orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-panel text-sm">
              {payments.map((p) => (
                <li key={p.currency} className="flex justify-between px-4 py-3">
                  <span>
                    {p.count} {p.count === 1 ? "order" : "orders"} in{" "}
                    {p.currency}
                  </span>
                  <span className="tabular-nums">
                    {(p.total_minor / 100).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

          </>
        )}
        {tab === "users" && (
          <>
      <h2 className="mt-10 font-display text-xl font-semibold">Users</h2>
      <p className="mt-1 text-sm text-ink-2">
        {signups.total} in total. {signups.today} in the last day, {signups.week} in the last 7 days, {signups.month} in the last 30.
        The 50 newest are below.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-panel">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-2">
              {["Email", "Country", "Joined", "Credits", "Generations", "Paid"].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-medium ${i >= 3 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{u.email ?? u.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{u.country ?? "unknown"}</td>
                <td className="px-4 py-3 text-ink-2">{timeAgo(u.created_at)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.balance}</td>
                <td className="px-4 py-3 text-right tabular-nums">{u.jobs}</td>
                <td className="px-4 py-3 text-right">{u.paid ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

          </>
        )}
        {tab === "payments" && (
          <>
      <h2 className="mt-10 font-display text-xl font-semibold">Recent payments</h2>
      {recentPayments.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">No payments yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-panel text-sm">
          {recentPayments.map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="min-w-0 truncate">
                {p.email ?? "unknown"}
                <span className="ml-3 text-ink-2">
                  {p.credits} credits, {timeAgo(p.created_at)}
                  {p.status === "refunded" ? ", refunded" : ""}
                </span>
              </span>
              <span className="tabular-nums">${(p.total_minor / 100).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}

          </>
        )}
        {tab === "referrals" && <ReferralsTab referrers={referrers} payouts={payouts} demo={demo} />}
        {tab === "margins" && (
          <>
      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Margin by model</h2>
        <div className="flex gap-1.5" role="group" aria-label="Period">
          {[
            { d: 7, l: "7 days" },
            { d: 30, l: "30 days" },
            { d: 0, l: "All time" },
          ].map((o) => (
            <Link
              key={o.d}
              href={`${base}/admin?tab=margins&days=${o.d}`}
              aria-current={(days ?? 0) === o.d ? "true" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${(days ?? 0) === o.d ? "border-accent text-ink" : "border-line text-ink-2 hover:text-ink"}`}
            >
              {o.l}
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-2">
        Revenue is what buyers paid for the credits each job used, before tax. Cost is the lab cost plus{" "}
        {(OPENROUTER_TOPUP_FEE * 100).toFixed(1)}% OpenRouter top-up fee on OpenRouter models and an estimated{" "}
        {(PAYMENT_FEE_RATE * 100).toFixed(2)}% payment fee. Free
        credits earn nothing and are shown apart. Target is {Math.round(TARGET_MARGIN * 100)}%.
      </p>
      {margins.length === 0 ? (
        <p className="mt-4 text-sm text-ink-2">
          No generations in this period.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-panel">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-2">
                {[
                  "Model",
                  "Done",
                  "Failed",
                  "Credits",
                  "Free",
                  "Revenue",
                  "Lab cost",
                  "Per job",
                  "Margin",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 font-medium ${i > 0 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {margins.map((r) => {
                const m = marginFor(r);
                return (
                  <tr
                    key={r.model_key}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {modelNames[r.model_key] ?? r.model_key}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.ok_jobs}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.failed_jobs}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.credits}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.free_credits}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {usd(r.revenue_micros)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {usd(r.lab_cost_micros)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {m.avgCostMicros !== null
                        ? usd(m.avgCostMicros, 3)
                        : "none"}
                      {r.ok_jobs > 0 && r.actual_cost_jobs < r.ok_jobs && (
                        <span className="text-ink-2"> est</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium tabular-nums ${m.belowTarget ? "text-danger" : ""}`}
                    >
                      {m.margin !== null
                        ? `${(m.margin * 100).toFixed(1)}%`
                        : "none"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

          </>
        )}
        {tab === "labs" && (
          <>
      <h2 className="mt-8 font-display text-xl font-semibold">Lab balances</h2>
      <p className="mt-1 max-w-xl text-sm text-ink-2">
        OpenRouter runs nearly every model and reports its own balance, so it
        needs no entry. Other labs do not report theirs: enter it from their
        console after a top-up and the estimate subtracts the lab cost logged on
        each job since.
      </p>
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {shown.map((s) => (
          <LabCard key={s.lab} stat={s} demo={demo} />
        ))}
      </ul>

          </>
        )}
        {tab === "credits" && <GrantForm demo={demo} />}
      </div>
    </div>
  );
}

function ReferralsTab({ referrers, payouts, demo }: { referrers: NonNullable<Props["referrers"]>; payouts: NonNullable<Props["payouts"]>; demo?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const money = (c: number) => `$${(c / 100).toFixed(2)}`;
  const open = payouts.filter((p) => p.status === "requested");
  const settled = payouts.filter((p) => p.status !== "requested").slice(0, 10);

  // Pay the person first (UPI, bank, Wise), then mark it paid here. Rejecting hands the earnings back to them.
  async function settle(id: string, status: "paid" | "rejected") {
    if (demo) return setMsg("Saving is off in the preview.");
    const note = status === "rejected" ? (window.prompt("Why is it rejected? The referrer does not see this.") ?? "") : "";
    if (status === "rejected" && !note) return;
    if (status === "paid" && !window.confirm("Mark as paid? Only do this after you have sent the money.")) return;
    setBusy(id);
    setMsg(null);
    const res = await fetch("/api/admin/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, note: note || undefined }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setMsg(body.error ?? "Could not update the payout.");
    router.refresh();
  }

  return (
    <>
      <h2 className="mt-10 font-display text-xl font-semibold">Payouts waiting</h2>
      {msg && <p className="mt-2 text-sm text-danger">{msg}</p>}
      {open.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Nothing waiting.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {open.map((p) => (
            <li key={p.id} className="rounded-2xl bg-panel p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {p.email ?? "unknown"}
                  {p.flagged && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">Check first</span>}
                </span>
                <span className="font-display text-lg font-semibold tabular-nums">{money(p.amountCents)}</span>
              </div>
              <p className="mt-1 break-all text-ink-2">
                {p.method}: {p.destination}
              </p>
              <p className="text-xs text-ink-2">Requested {timeAgo(p.createdAt)}</p>
              <div className="mt-3 flex gap-2">
                <button disabled={busy === p.id} onClick={() => settle(p.id, "paid")} className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-ink disabled:opacity-50">
                  Mark paid
                </button>
                <button disabled={busy === p.id} onClick={() => settle(p.id, "rejected")} className="rounded-full bg-panel-2 px-4 py-2 text-xs font-semibold disabled:opacity-50">
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-display text-xl font-semibold">Referrers</h2>
      <p className="mt-1 text-sm text-ink-2">Earned is what they have earned in total, refunds taken off. Flagged ones are over the limits in src/config/referral.ts.</p>
      {referrers.length === 0 ? (
        <p className="mt-3 text-sm text-ink-2">No referrals yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-panel text-sm">
          {referrers.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="min-w-0 truncate">
                {r.email ?? "unknown"}
                {r.flagged && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">Flagged</span>}
                <span className="ml-3 text-ink-2">{r.referred} referred</span>
              </span>
              <span className="tabular-nums">{money(r.earnedCents)}</span>
            </li>
          ))}
        </ul>
      )}

      {settled.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl font-semibold">Recent payouts</h2>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-panel text-sm">
            {settled.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="min-w-0 truncate">
                  {p.email ?? "unknown"}
                  <span className="ml-3 text-ink-2">
                    {p.status}, {timeAgo(p.createdAt)}
                  </span>
                </span>
                <span className="tabular-nums">{money(p.amountCents)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function LabCard({ stat, demo }: { stat: LabStat; demo?: boolean }) {
  const router = useRouter();
  const r = assessLab(stat);
  const level = LEVELS[r.level];
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (demo) {
      setBusy(false);
      return setMsg("Saving is off in the preview.");
    }
    const res = await fetch("/api/admin/labs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lab: stat.lab,
        balanceUsd: Number(balance),
        note: note || undefined,
      }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(body.error ?? "Could not save.");
    setBalance("");
    setNote("");
    setMsg("Saved.");
    router.refresh();
  }

  return (
    <li className="rounded-2xl bg-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">{r.name}</h3>
        <span className={`text-sm font-medium ${level.cls}`}>
          {level.label}
        </span>
      </div>
      {r.remainingMicros !== null ? (
        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-ink-2">Estimated left</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {usd(Math.max(0, r.remainingMicros))}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">Spend per day</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {usd(r.burnPerDayMicros)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">Runway</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {r.runwayDays !== null
                ? `${r.runwayDays.toFixed(1)} days`
                : "none"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-ink-2">
          {stat.lab === "openrouter"
            ? "Could not read the balance from OpenRouter. Enter it from the console to track it by hand."
            : `Enter the balance from the ${r.name} console to start tracking.`}
        </p>
      )}
      {r.note && <p className="mt-2 text-xs text-ink-2">{r.note}</p>}

      <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="min-w-24 flex-1 text-xs text-ink-2">
          Balance now (USD)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="min-w-32 flex-[2] text-xs text-ink-2">
          Note
          <input
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Topped up $40"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
          />
        </label>
        <button
          disabled={busy}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50"
        >
          Record
        </button>
      </form>
      {msg && (
        <p role="status" className="mt-2 text-xs text-ink-2">
          {msg}
        </p>
      )}
    </li>
  );
}

function GrantForm({ demo }: { demo?: boolean }) {
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (demo) {
      setBusy(false);
      return setMsg("Granting is off in the preview.");
    }
    const res = await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, credits: Number(credits) }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(body.error ?? "Could not add credits.");
    setMsg(`Added ${body.credits} credits to ${body.email}.`);
    setEmail("");
    setCredits("");
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-semibold">
        Add credits to a user
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        For support and testing. The user needs to have signed in once.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 text-xs text-ink-2">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="w-28 text-xs text-ink-2">
          Credits
          <input
            required
            type="number"
            min="1"
            step="1"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink"
          />
        </label>
        <button
          disabled={busy}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50"
        >
          Add credits
        </button>
      </form>
      {msg && (
        <p role="status" className="mt-3 text-sm text-ink-2">
          {msg}
        </p>
      )}
    </section>
  );
}
