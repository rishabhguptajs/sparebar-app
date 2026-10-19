"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, UploadIcon } from "@/components/icons";
import { Thumb } from "@/components/media";
import { ProfileFields } from "@/components/profile-fields";
import { checkPhoto, PHOTO_TIPS } from "@/lib/photo-check";
import { EMPTY_PROFILE, hasProfile, type CharacterProfile } from "@/lib/prompts/profile";
import { resizeImage } from "@/lib/resize-image";
import { sampleJobs } from "@/lib/sample";
import type { CharacterCard, PresentedJob } from "@/lib/ui-types";

const CANDIDATES = 3;

type Props = {
  open: boolean;
  onClose: () => void;
  portraitCredits: number;
  /** Called with the saved character once it exists. */
  onCreated: (character: CharacterCard | null) => void;
  demo?: boolean;
};

/** The form for making a character, shown as a modal. Used on the Characters page and from the studio. */
export function NewCharacterDialog({ open, onClose, portraitCredits, onCreated, demo }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [profile, setProfile] = useState<CharacterProfile>(EMPTY_PROFILE);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  // Tips for each photo: from a check in the browser, then from a quick look by a vision model.
  const [tips, setTips] = useState<string[][]>([]);
  const [candidates, setCandidates] = useState<PresentedJob[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function reset() {
    setName("");
    setDescription("");
    setNiche("");
    setTone("");
    setProfile(EMPTY_PROFILE);
    setFiles([]);
    setTips([]);
    setCandidates(null);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    try {
      // Shrink first: phone photos are several MB, more than a server request can carry.
      const resized = await Promise.all(Array.from(list).map(resizeImage));
      const room = Math.max(0, 3 - files.length);
      const added = resized.slice(0, room);
      setFiles((prev) => [...prev, ...added].slice(0, 3));
      const start = tips.length;
      setTips((prev) => [...prev, ...added.map(() => [] as string[])].slice(0, 3));
      added.forEach(async (file, i) => {
        const local = (await checkPhoto(file)).map((issue) => PHOTO_TIPS[issue]);
        setTips((prev) => prev.map((t, j) => (j === start + i ? [...t, ...local] : t)));
        if (demo) return;
        try {
          const body = new FormData();
          body.set("photo", file);
          const res = await fetch("/api/uploads/check", { method: "POST", body });
          const found = res.ok ? ((await res.json()).tips as string[]) : [];
          if (found.length) setTips((prev) => prev.map((t, j) => (j === start + i ? [...t, ...found] : t)));
        } catch {
          // advice only
        }
      });
    } catch {
      setError("We could not read that photo. Use a JPG, PNG or WebP.");
    }
  }

  async function save(pickedJobId?: string) {
    if (demo) {
      onCreated(null);
      return close();
    }
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.set("name", name);
    body.set("description", description);
    body.set("niche", niche);
    body.set("tone", tone);
    body.set("profile", JSON.stringify(profile));
    if (pickedJobId) body.set("pickedJobId", pickedJobId);
    files.forEach((f) => body.append("photos", f));
    try {
      const res = await fetch("/api/characters", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      onCreated(data.character as CharacterCard);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const generating = files.length === 0;
  const hasLook = description.trim().length >= 10 || hasProfile(profile);

  async function makeCandidates() {
    if (demo) {
      setCandidates(sampleJobs.filter((j) => j.kind === "image").slice(0, 3));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/characters/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setCandidates(data.jobs as PresentedJob[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={() => {
        setError(null);
        onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border border-line bg-panel p-0"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!candidates) save();
        }}
        className="space-y-5 p-6"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">New character</h2>
          <button type="button" onClick={close} aria-label="Close" className="rounded-lg p-1.5 text-ink-2 hover:bg-panel-2">
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="c-name" className="text-sm font-medium">
            Name
          </label>
          <input id="c-name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya" className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Look</p>
          <p className="text-xs text-ink-2">The more you set, the more the same person comes out in every post. Skip what you do not need.</p>
          <ProfileFields value={profile} onChange={setProfile} idPrefix="c" />
        </div>

        <div className="space-y-2">
          <label htmlFor="c-desc" className="text-sm font-medium">
            Anything else <span className="font-normal text-ink-2">(optional)</span>
          </label>
          <textarea
            id="c-desc"
            rows={2}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Late twenties, shoulder length dark curls, warm brown skin, small gold hoops"
            className="w-full resize-y rounded-xl border border-line bg-bg px-4 py-2.5 text-sm leading-relaxed"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="c-niche" className="text-sm font-medium">
              Niche <span className="font-normal text-ink-2">(optional)</span>
            </label>
            <input id="c-niche" maxLength={80} value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Skincare" className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm" />
          </div>
          <div className="space-y-2">
            <label htmlFor="c-tone" className="text-sm font-medium">
              Tone of voice <span className="font-normal text-ink-2">(optional)</span>
            </label>
            <input id="c-tone" maxLength={80} value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Warm and chatty" className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Photos</p>
          <div className="flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <div key={src} className="relative size-20 overflow-hidden rounded-xl bg-panel-2">
                <Thumb src={src} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => {
                    setFiles((f) => f.filter((_, j) => j !== i));
                    setTips((t) => t.filter((_, j) => j !== i));
                  }}
                  className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white"
                >
                  <CloseIcon width={12} height={12} />
                </button>
              </div>
            ))}
            {files.length < 3 && (
              <label className="grid size-20 cursor-pointer place-items-center rounded-xl border border-dashed border-line text-ink-2 hover:text-ink">
                <span className="flex flex-col items-center gap-1 text-xs">
                  <UploadIcon width={18} height={18} />
                  Add
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          {tips.some((t) => t.length > 0) && (
            <ul className="space-y-1 text-xs text-ink-2" aria-live="polite">
              {tips.map((t, i) =>
                t.map((line) => (
                  <li key={`${i}-${line}`}>
                    Photo {i + 1}: {line}
                  </li>
                )),
              )}
            </ul>
          )}
          <p className="text-xs text-ink-2">
            {generating
              ? `No photos? We generate a portrait from the look above for ${portraitCredits} credits, or show you ${CANDIDATES} to pick from for ${portraitCredits * CANDIDATES}.`
              : "Up to 3 clear photos of the same person: front facing, one person, no sunglasses. PNG, JPG or WebP. Large photos are shrunk before upload."}
          </p>
        </div>

        {candidates && (
          <div className="space-y-3" aria-label="Pick a portrait">
            <p className="text-sm font-medium">Pick the one that looks like {name || "your character"}</p>
            <ul className="grid grid-cols-3 gap-3">
              {candidates.map((c) => (
                <li key={c.id}>
                  <button type="button" disabled={busy} onClick={() => save(c.id)} className="block w-full overflow-hidden rounded-xl border border-line hover:border-accent disabled:opacity-40">
                    {c.outputs[0] && <Thumb src={c.outputs[0].url} alt="Portrait option" className="aspect-[3/4] w-full object-cover" />}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setCandidates(null)} className="text-xs text-ink-2 hover:text-ink">
              Back
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {!candidates && (
          <div className="space-y-2">
            <button disabled={busy || !name.trim() || (generating && !hasLook)} className="w-full rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink disabled:opacity-40">
              {busy ? (generating ? "Generating portrait" : "Saving") : generating ? `Create with portrait for ${portraitCredits} credits` : "Save character"}
            </button>
            {generating && (
              <button type="button" onClick={makeCandidates} disabled={busy || !name.trim() || !hasLook} className="w-full rounded-full border border-line px-5 py-3 text-[15px] font-medium hover:bg-panel-2 disabled:opacity-40">
                {busy ? "Generating" : `Show ${CANDIDATES} options for ${portraitCredits * CANDIDATES} credits`}
              </button>
            )}
          </div>
        )}
      </form>
    </dialog>
  );
}
