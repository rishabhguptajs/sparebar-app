"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Thumb } from "@/components/media";
import { ProfileFields } from "@/components/profile-fields";
import { resizeImage } from "@/lib/resize-image";
import type { CharacterCard, OutfitCard } from "@/lib/ui-types";

const field = "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm";
const TAG_LABEL: Record<string, string> = { photo: "Photo", front: "Front", angle: "Three quarter", full: "Full body" };

type Props = {
  character: CharacterCard | null;
  /** Credits one extra shot costs, so the angle button can show the total. */
  shotCredits: number;
  onClose: () => void;
  onChanged: () => void;
  demo?: boolean;
};

/** Edit a character after it is made: its look, its photos and angles, and its saved outfits. */
export function CharacterDialog({ character, shotCredits, onClose, onChanged, demo }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<CharacterCard | null>(character);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [profile, setProfile] = useState(character?.profile);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outfitName, setOutfitName] = useState("");
  const [outfitText, setOutfitText] = useState("");
  const [outfitPhoto, setOutfitPhoto] = useState<File | null>(null);

  useEffect(() => {
    setView(character);
    setName(character?.name ?? "");
    setDescription(character?.description ?? "");
    setNiche(character?.niche ?? "");
    setTone(character?.tone ?? "");
    setProfile(character?.profile);
    setError(null);
    const el = dialog.current;
    if (!el) return;
    if (character && !el.open) el.showModal();
    if (!character && el.open) el.close();
    // Reset only when a different character is opened, so a refresh after one change keeps unsaved edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id]);

  async function call(label: string, url: string, init: RequestInit, apply?: (data: Record<string, unknown>) => void) {
    if (demo) return;
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(url, init);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      apply?.(data);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const json = (method: string, body?: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const setCharacter = (d: Record<string, unknown>) => d.character && setView((v) => ({ ...(v as CharacterCard), ...(d.character as CharacterCard) }));

  if (!view || !profile) {
    return <dialog ref={dialog} onClose={onClose} />;
  }
  const id = view.id;

  async function addOutfit() {
    const body = new FormData();
    body.set("name", outfitName);
    body.set("description", outfitText);
    if (outfitPhoto) body.set("photo", await resizeImage(outfitPhoto));
    await call("outfit", `/api/characters/${id}/outfits`, { method: "POST", body }, (d) => {
      setView((v) => (v ? { ...v, outfits: [...v.outfits, d.outfit as OutfitCard] } : v));
      setOutfitName("");
      setOutfitText("");
      setOutfitPhoto(null);
    });
  }

  return (
    <dialog ref={dialog} onClose={onClose} className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border border-line bg-panel p-0">
      <div className="space-y-7 p-6">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{view.name}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-2 hover:bg-panel-2">
            <CloseIcon />
          </button>
        </div>

        {/* Photos */}
        <section aria-label="Photos" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Photos the model sees</h3>
            {view.photoCount <= 4 && (
              <button type="button" disabled={!!busy} onClick={() => call("angles", `/api/characters/${id}/angles`, json("POST"), setCharacter)} className="rounded-full border border-line px-3.5 py-1.5 text-sm hover:bg-panel-2 disabled:opacity-40">
                {busy === "angles" ? "Generating" : `Add side and full body shots, ${shotCredits * 2} credits`}
              </button>
            )}
          </div>
          <ul className="flex flex-wrap gap-3">
            {view.photoUrls.map((src, i) => (
              <li key={src} className="relative w-24">
                <div className="aspect-[3/4] overflow-hidden rounded-xl bg-panel-2">
                  <Thumb src={src} alt={`${view.name} ${TAG_LABEL[view.angleTags[i]] ?? "photo"}`} className="size-full object-cover" />
                </div>
                <p className="mt-1 text-center text-xs text-ink-2">{TAG_LABEL[view.angleTags[i]] ?? "Photo"}</p>
                {view.photoCount > 1 && (
                  <button type="button" aria-label="Remove photo" disabled={!!busy} onClick={() => call("photo", `/api/characters/${id}`, json("PATCH", { removeReference: i }), setCharacter)} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white">
                    <CloseIcon width={12} height={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-2">More angles of the same person give later posts a stronger reference. Close ups use the front shot, outfit shots use the full body one.</p>
        </section>

        {/* Look */}
        <section aria-label="Look" className="space-y-3">
          <h3 className="text-sm font-medium">Look and persona</h3>
          <input aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={field} />
          <ProfileFields value={profile} onChange={setProfile} idPrefix="e" />
          <textarea aria-label="Anything else" rows={2} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Anything else about the look" className={`${field} resize-y leading-relaxed`} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input aria-label="Niche" value={niche} onChange={(e) => setNiche(e.target.value)} maxLength={80} placeholder="Niche" className={field} />
            <input aria-label="Tone of voice" value={tone} onChange={(e) => setTone(e.target.value)} maxLength={80} placeholder="Tone of voice" className={field} />
          </div>
          <button type="button" disabled={!!busy || !name.trim()} onClick={() => call("save", `/api/characters/${id}`, json("PATCH", { name, description, niche, tone, profile }), setCharacter)} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-40">
            {busy === "save" ? "Saving" : "Save changes"}
          </button>
        </section>

        {/* Outfits */}
        <section aria-label="Outfits" className="space-y-3">
          <h3 className="text-sm font-medium">Saved outfits</h3>
          {view.outfits.length === 0 && <p className="text-xs text-ink-2">Save an outfit once and pick it in any post, so {view.name} wears the same thing.</p>}
          <ul className="space-y-2">
            {view.outfits.map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-xl bg-bg p-2">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-panel-2">{o.photoUrl && <Thumb src={o.photoUrl} alt="" className="size-full object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.name}</p>
                  <p className="truncate text-xs text-ink-2">{o.description || "Outfit photo"}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${o.name}`}
                  disabled={!!busy}
                  onClick={() => call("outfit", `/api/outfits/${o.id}`, json("DELETE"), () => setView((v) => (v ? { ...v, outfits: v.outfits.filter((x) => x.id !== o.id) } : v)))}
                  className="rounded-md p-1.5 text-ink-2 hover:bg-panel-2 hover:text-ink"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <input aria-label="Outfit name" value={outfitName} onChange={(e) => setOutfitName(e.target.value)} maxLength={60} placeholder="Brunch" className={field} />
            <input aria-label="Outfit description" value={outfitText} onChange={(e) => setOutfitText(e.target.value)} maxLength={200} placeholder="Linen shirt, high waisted jeans, white sneakers" className={field} />
            <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-line px-3 text-xs text-ink-2 hover:text-ink">
              <span className="flex items-center gap-1.5">
                <UploadIcon width={16} height={16} />
                {outfitPhoto ? "Photo added" : "Photo"}
              </span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { setOutfitPhoto(e.target.files?.[0] ?? null); e.target.value = ""; }} />
            </label>
          </div>
          <button type="button" disabled={!!busy || !outfitName.trim() || (!outfitText.trim() && !outfitPhoto)} onClick={addOutfit} className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-panel-2 disabled:opacity-40">
            {busy === "outfit" ? "Saving" : "Save outfit"}
          </button>
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
