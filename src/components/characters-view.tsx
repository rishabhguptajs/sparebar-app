"use client";

import { useRefreshData } from "@/lib/queries";
import Link from "next/link";
import { useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { NewCharacterDialog } from "@/components/new-character-dialog";
import { Thumb } from "@/components/media";
import type { CharacterCard } from "@/lib/ui-types";

type Props = {
  base: string;
  characters: CharacterCard[];
  portraitCredits: number;
  openNew?: boolean;
  demo?: boolean;
};

export function CharactersView({ base, characters, portraitCredits, openNew, demo }: Props) {
  const refresh = useRefreshData();
  const [creating, setCreating] = useState(openNew ?? false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function remove(id: string) {
    setConfirmId(null);
    if (!demo) await fetch(`/api/characters/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Characters</h1>
          <p className="mt-1 max-w-md text-sm text-ink-2">
            A character keeps the same face across every image and video you make with it.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink"
        >
          <PlusIcon width={18} height={18} /> New character
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">No characters yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">
            Upload a few photos, or describe someone and we make a portrait. Then pick them in the studio.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-6 rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2"
          >
            Create your first character
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {characters.map((c) => (
            <li key={c.id} className="group relative overflow-hidden rounded-2xl bg-panel">
              <div className="aspect-[3/4] bg-panel-2">
                {c.coverUrl && <Thumb src={c.coverUrl} alt={c.name} className="size-full object-cover" />}
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="line-clamp-2 min-h-8 text-xs text-ink-2">{c.description || "No description"}</p>
                <div className="flex items-center justify-between pt-1">
                  <Link href={`${base}?character=${c.id}`} className="text-sm font-medium text-accent hover:underline">
                    Use in studio
                  </Link>
                  {confirmId === c.id ? (
                    <span className="flex items-center gap-1 text-xs">
                      <button onClick={() => remove(c.id)} className="rounded-md px-1.5 py-1 font-medium text-danger">
                        Remove
                      </button>
                      <button onClick={() => setConfirmId(null)} className="rounded-md px-1.5 py-1 text-ink-2">
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(c.id)}
                      aria-label={`Remove ${c.name}`}
                      className="rounded-md p-1.5 text-ink-2 hover:bg-panel-2 hover:text-ink"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewCharacterDialog open={creating} onClose={() => setCreating(false)} portraitCredits={portraitCredits} onCreated={() => refresh()} demo={demo} />
    </div>
  );
}
