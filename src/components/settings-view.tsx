"use client";

import { useState } from "react";
import { STATES } from "@/config/plans";
import { brand } from "@/config/brand";
import { useRefreshData } from "@/lib/queries";

type Props = { email: string | null; fullName: string; stateCode: string; region: "IN" | "OTHER" };

const field = "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm";

export function SettingsView({ email, fullName, stateCode, region }: Props) {
  const [name, setName] = useState(fullName);
  const [state, setState] = useState(stateCode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const refresh = useRefreshData();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName: name, stateCode: region === "IN" ? state : "" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save. Try again.");
      setMessage({ ok: true, text: "Saved." });
      refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 lg:px-10 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-ink-2">Your account details.</p>

      <form onSubmit={save} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label htmlFor="s-name" className="text-sm font-medium">
            Name
          </label>
          <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" className={field} />
          <p className="text-xs text-ink-2">The name on your account.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="s-email" className="text-sm font-medium">
            Email
          </label>
          <input id="s-email" value={email ?? ""} readOnly disabled className={`${field} text-ink-2`} />
          <p className="text-xs text-ink-2">This is the address you sign in with.</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Payments</p>
          <p className="rounded-xl bg-panel-2 px-4 py-3 text-sm text-ink-2">
            {region === "IN" ? "You pay in rupees." : "You pay in US dollars."} This is set from the country you signed in from.
          </p>
        </div>

        {region === "IN" && (
          <div className="space-y-2">
            <label htmlFor="s-state" className="text-sm font-medium">
              State
            </label>
            <select id="s-state" value={state} onChange={(e) => setState(e.target.value)} className={field}>
              <option value="">Choose a state</option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-2">Used to work out tax when you buy credits.</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button disabled={busy} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-40">
            {busy ? "Saving" : "Save changes"}
          </button>
          {message && (
            <p role="status" className={`text-sm ${message.ok ? "text-ink-2" : "text-danger"}`}>
              {message.text}
            </p>
          )}
        </div>
      </form>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="text-sm font-medium">Session</h2>
        <form action="/auth/signout" method="post" className="mt-3">
          <button className="rounded-full border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:bg-panel">Sign out</button>
        </form>
      </section>

      <section className="mt-8 border-t border-line pt-8">
        <h2 className="text-sm font-medium">Delete your account</h2>
        <p className="mt-2 text-sm text-ink-2">
          To delete your account and its data, email{" "}
          <a href={`mailto:${brand.supportEmail}?subject=Delete my account`} className="text-ink underline underline-offset-2">
            {brand.supportEmail}
          </a>{" "}
          from the address you sign in with.
        </p>
      </section>
    </div>
  );
}
