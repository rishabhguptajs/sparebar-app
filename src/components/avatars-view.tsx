"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { Thumb } from "@/components/media";
import { useRefreshData } from "@/lib/queries";
import type { AvatarCard, CharacterCard } from "@/lib/ui-types";

type Props = { base: string; avatars: AvatarCard[]; demo?: boolean };

const GENDERS = [
  { key: "all", label: "Everyone" },
  { key: "woman", label: "Women" },
  { key: "man", label: "Men" },
] as const;

const SHOT_LABEL: Record<number, string> = { 0: "Front", 1: "Three quarter", 2: "Full body" };

/** Ready-made people a brand can start from. Picking one copies it into their characters. */
export function AvatarsView({ base, avatars, demo }: Props) {
  const router = useRouter();
  const refresh = useRefreshData();
  const [gender, setGender] = useState<(typeof GENDERS)[number]["key"]>("all");
  const [niche, setNiche] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [shot, setShot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const niches = [...new Set(avatars.flatMap((a) => a.niches))].sort();
  const shown = avatars.filter((a) => (gender === "all" || a.gender === gender) && (niche === "all" || a.niches.includes(niche)));
  const open = avatars.find((a) => a.id === openId) ?? null;

  async function pick(a: AvatarCard) {
    if (demo) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/avatars/${a.id}/pick`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      refresh();
      router.push(`${base}?character=${(data.character as CharacterCard).id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const chip = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-sm ${on ? "border-accent text-ink" : "border-line text-ink-2 hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-10 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Avatars</h1>
        <div className="inline-flex rounded-full border border-line p-1" role="group" aria-label="Filter by gender">
          {GENDERS.map((g) => (
            <button key={g.key} type="button" aria-pressed={gender === g.key} onClick={() => setGender(g.key)} className={`rounded-full px-4 py-1.5 text-sm ${gender === g.key ? "bg-accent font-medium text-accent-ink" : "text-ink-2 hover:text-ink"}`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="-mx-5 mt-4 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Filter by niche">
        {["all", ...niches].map((n) => (
          <button key={n} type="button" aria-pressed={niche === n} onClick={() => setNiche(n)} className={`${chip(niche === n)} shrink-0 capitalize`}>
            {n === "all" ? "All niches" : n}
          </button>
        ))}
      </div>

      {avatars.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">Avatars are on the way</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">In the meantime you can make your own character from photos or a description.</p>
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-sm text-ink-2">No avatars match those filters.</p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-2xl bg-panel">
              <button
                type="button"
                onClick={() => {
                  setOpenId(a.id);
                  setShot(0);
                  setError(null);
                }}
                className="block w-full text-left"
                aria-label={`View ${a.name}`}
              >
                <div className="aspect-[3/4] bg-panel-2">{a.coverUrl && <Thumb src={a.coverUrl} alt={a.name} className="size-full object-cover" />}</div>
                <div className="space-y-0.5 px-3 py-2.5">
                  <p className="truncate text-sm font-medium">
                    {a.name}
                    {a.ageRange && <span className="font-normal text-ink-2">, {a.ageRange}</span>}
                  </p>
                  {a.brandCount > 0 && <p className="text-xs text-ink-2">Used by {a.brandCount} {a.brandCount === 1 ? "brand" : "brands"}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => !busy && setOpenId(null)}>
          <div className="max-h-[calc(100dvh-2rem)] w-[min(40rem,100%)] overflow-y-auto rounded-3xl border border-line bg-panel p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {open.name}
                  {open.ageRange && <span className="font-normal text-ink-2">, {open.ageRange}</span>}
                </h2>
                <p className="mt-0.5 text-sm text-ink-2">{open.tagline}</p>
              </div>
              <button type="button" onClick={() => setOpenId(null)} aria-label="Close" className="rounded-lg p-1.5 text-ink-2 hover:bg-panel-2">
                <CloseIcon />
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr]">
              <div>
                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-panel-2">
                  {open.photoUrls[shot] && <Thumb src={open.photoUrls[shot]} alt={`${open.name}, ${SHOT_LABEL[shot] ?? "photo"}`} className="size-full object-cover" />}
                </div>
                {open.photoUrls.length > 1 && (
                  <div className="mt-2 flex gap-1.5">
                    {open.photoUrls.map((u, i) => (
                      <button key={u} type="button" onClick={() => setShot(i)} aria-label={SHOT_LABEL[i] ?? `Photo ${i + 1}`} aria-pressed={shot === i} className={`size-14 overflow-hidden rounded-lg border ${shot === i ? "border-accent" : "border-line"}`}>
                        <Thumb src={u} alt="" className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <p className="leading-relaxed text-ink-2">{open.description}</p>
                {open.tone && (
                  <p>
                    <span className="font-medium">Sounds: </span>
                    <span className="text-ink-2">{open.tone}</span>
                  </p>
                )}
                <p className="flex flex-wrap gap-1.5">
                  {open.niches.map((n) => (
                    <span key={n} className="rounded-full bg-panel-2 px-2.5 py-1 text-xs capitalize text-ink-2">
                      {n}
                    </span>
                  ))}
                </p>
                {open.brandCount > 0 && <p className="text-xs text-ink-2">Used by {open.brandCount} {open.brandCount === 1 ? "brand" : "brands"}</p>}
              </div>
            </div>
            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
            <button type="button" disabled={busy} onClick={() => pick(open)} className="mt-5 w-full rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink disabled:opacity-40">
              {busy ? "Adding" : `Use ${open.name}`}
            </button>
            <p className="mt-2 text-center text-xs text-ink-2">Free. {open.name} is added to your characters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
