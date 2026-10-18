"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, UploadIcon } from "@/components/icons";
import { Thumb } from "@/components/media";
import { resizeImage } from "@/lib/resize-image";
import type { CharacterCard } from "@/lib/ui-types";

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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
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
    setFiles([]);
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
      setFiles((prev) => [...prev, ...resized].slice(0, 3));
    } catch {
      setError("We could not read that photo. Use a JPG, PNG or WebP.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (demo) {
      onCreated(null);
      return close();
    }
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.set("name", name);
    body.set("description", description);
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

  return (
  <dialog
    ref={dialog}
    onClose={() => { setError(null); onClose(); }}
    className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border border-line bg-panel p-0"
  >
    <form onSubmit={submit} className="space-y-5 p-6">
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
        <input
          id="c-name"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maya"
          className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="c-desc" className="text-sm font-medium">
          Look
        </label>
        <textarea
          id="c-desc"
          rows={3}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Late twenties, shoulder length dark curls, warm brown skin, small gold hoops"
          className="w-full resize-y rounded-xl border border-line bg-bg px-4 py-2.5 text-sm leading-relaxed"
        />
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
                onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
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
        <p className="text-xs text-ink-2">
          {generating
            ? `No photos? We generate a portrait from your description for ${portraitCredits} credits.`
            : "Up to 3 clear photos of the same person. PNG, JPG or WebP. Large photos are shrunk before upload."}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        disabled={busy || !name.trim()}
        className="w-full rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink disabled:opacity-40"
      >
        {busy ? (generating ? "Generating portrait" : "Saving") : generating ? `Create with portrait for ${portraitCredits} credits` : "Save character"}
      </button>
    </form>
  </dialog>
  );
}
