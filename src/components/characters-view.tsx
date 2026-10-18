"use client";

import { useRefreshData } from "@/lib/queries";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Thumb } from "@/components/media";
import { resizeImage } from "@/lib/resize-image";
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
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (openNew) dialog.current?.showModal();
  }, [openNew]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function close() {
    dialog.current?.close();
    setName("");
    setDescription("");
    setFiles([]);
    setError(null);
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
    if (demo) return close();
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
      close();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setConfirmId(null);
    if (!demo) await fetch(`/api/characters/${id}`, { method: "DELETE" });
    refresh();
  }

  const generating = files.length === 0;

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
          onClick={() => dialog.current?.showModal()}
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
            onClick={() => dialog.current?.showModal()}
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

      <dialog
        ref={dialog}
        onClose={() => setError(null)}
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
    </div>
  );
}
