"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Thumb } from "@/components/media";
import type { AvatarCard } from "@/lib/ui-types";

type Entry = { slug: string; name: string; gender: string; niches: string[]; tagline: string; ageRange: string; description: string; saved: AvatarCard | null };
type Candidate = { key: string; url: string };

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

/** Owner page: make portraits for each roster entry, pick the best, check them, then show the avatar to brands. */
export function AvatarAdmin({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(slug: string, fn: () => Promise<void>) {
    setBusy(slug);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(`${slug}: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setBusy(null);
    }
  }

  const live = entries.filter((e) => e.saved?.active).length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Avatars</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-2">
        {live} of {entries.length} are live. For each one: make 3 options, pick the best, then check all three shots against the checklist in docs/avatar-roster.md before showing it to brands. Making options spends lab credit, about 3 images each.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {entries.map((e) => {
          const cands = candidates[e.slug];
          const working = busy === e.slug;
          return (
            <li key={e.slug} className="rounded-2xl bg-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {e.name} <span className="font-normal text-ink-2">{e.gender}, {e.ageRange}</span>
                  </p>
                  <p className="text-xs text-ink-2">{e.tagline} · {e.niches.join(", ")}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs ${e.saved?.active ? "bg-accent text-accent-ink" : "bg-panel-2 text-ink-2"}`}>{e.saved?.active ? "Live" : e.saved?.photoUrls.length ? "Ready to review" : "No portrait"}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-xs text-ink-2">{e.description}</p>

              {e.saved && e.saved.photoUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {e.saved.photoUrls.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer" className="block aspect-[3/4] overflow-hidden rounded-lg bg-panel-2">
                      <Thumb src={u} alt={e.name} className="size-full object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {cands && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-medium">Pick the best (this replaces the saved portrait)</p>
                  <ul className="grid grid-cols-3 gap-2">
                    {cands.map((c) => (
                      <li key={c.key}>
                        <button
                          type="button"
                          disabled={working}
                          onClick={() =>
                            run(e.slug, async () => {
                              await post("/api/admin/avatars/choose", { slug: e.slug, key: c.key });
                              setCandidates((p) => {
                                const { [e.slug]: _drop, ...rest } = p;
                                return rest;
                              });
                            })
                          }
                          className="block w-full overflow-hidden rounded-lg border border-line hover:border-accent disabled:opacity-40"
                        >
                          <Thumb src={c.url} alt="Option" className="aspect-[3/4] w-full object-cover" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={working}
                  onClick={() =>
                    run(e.slug, async () => {
                      const d = await post("/api/admin/avatars/candidates", { slug: e.slug });
                      setCandidates((p) => ({ ...p, [e.slug]: d.candidates as Candidate[] }));
                    })
                  }
                  className="rounded-full border border-line px-4 py-2 text-sm hover:bg-panel-2 disabled:opacity-40"
                >
                  {working ? "Working" : e.saved?.photoUrls.length ? "Make new options" : "Make 3 options"}
                </button>
                {e.saved && e.saved.photoUrls.length > 0 && (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => run(e.slug, () => post("/api/admin/avatars/active", { slug: e.slug, active: !e.saved?.active }))}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-40"
                  >
                    {e.saved.active ? "Hide from brands" : "Show to brands"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
