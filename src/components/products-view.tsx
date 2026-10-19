"use client";

import { useState } from "react";
import { PeopleTabs } from "@/components/people-tabs";
import { CloseIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Thumb } from "@/components/media";
import { useRefreshData } from "@/lib/queries";
import { resizeImage } from "@/lib/resize-image";
import type { ProductCard } from "@/lib/ui-types";

const field = "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm";

function PhotoSlot({ label, hint, file, onFile }: { label: string; hint: string; file: File | null; onFile: (f: File | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {file && preview ? (
        <div className="relative size-24 overflow-hidden rounded-xl bg-panel-2">
          <Thumb src={preview} alt={label} className="size-full object-cover" />
          <button type="button" aria-label={`Remove ${label}`} onClick={() => { onFile(null); setPreview(null); }} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white">
            <CloseIcon width={12} height={12} />
          </button>
        </div>
      ) : (
        <label className="grid size-24 cursor-pointer place-items-center rounded-xl border border-dashed border-line text-ink-2 hover:text-ink">
          <span className="flex flex-col items-center gap-1 text-xs">
            <UploadIcon width={18} height={18} />
            Add
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const small = await resizeImage(f);
              onFile(small);
              setPreview(URL.createObjectURL(small));
            }}
          />
        </label>
      )}
      <p className="max-w-[16rem] text-xs text-ink-2">{hint}</p>
    </div>
  );
}

/** Saved products: a clean photo, a close up of the label and a one line pitch, reused in any post. */
export function ProductsView({ base, products, demo }: { base: string; products: ProductCard[]; demo?: boolean }) {
  const refresh = useRefreshData();
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [label, setLabel] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!photo || demo) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("name", name);
      body.set("pitch", pitch);
      body.set("photo", photo);
      if (label) body.set("label", label);
      const res = await fetch("/api/products", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setName("");
      setPitch("");
      setPhoto(null);
      setLabel(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setConfirmId(null);
    if (!demo) await fetch(`/api/products/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">
      <PeopleTabs base={base} current="products" />
      <h1 className="font-display text-3xl font-semibold tracking-tight">Products</h1>
      <p className="mt-1 max-w-lg text-sm text-ink-2">Save a product once and hold it in any post. The photos keep its shape and label the same every time.</p>

      <form onSubmit={add} className="mt-8 grid gap-5 rounded-3xl border border-line bg-panel p-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="p-name" className="text-sm font-medium">Name</label>
            <input id="p-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Glow vitamin C serum" className={field} />
          </div>
          <div className="space-y-2">
            <label htmlFor="p-pitch" className="text-sm font-medium">
              One line about it <span className="font-normal text-ink-2">(optional)</span>
            </label>
            <input id="p-pitch" maxLength={200} value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="A lightweight serum that brightens skin in two weeks" className={field} />
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          <PhotoSlot label="Product photo" hint="The whole product on a plain background, label facing the camera." file={photo} onFile={setPhoto} />
          <PhotoSlot label="Label close up" hint="Optional. A sharp close up of the label or logo keeps the text readable." file={label} onFile={setLabel} />
        </div>
        <div className="space-y-3 md:col-span-2">
          {error && (
            <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <button disabled={busy || !name.trim() || !photo} className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-40">
            <PlusIcon width={18} height={18} /> {busy ? "Saving" : "Save product"}
          </button>
        </div>
      </form>

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-ink-2">No products yet.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id} className="overflow-hidden rounded-2xl bg-panel">
              <div className="grid aspect-square grid-cols-1 bg-panel-2">{p.photoUrl && <Thumb src={p.photoUrl} alt={p.name} className="size-full object-cover" />}</div>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="line-clamp-2 min-h-8 text-xs text-ink-2">{p.pitch || (p.labelUrl ? "Label close up saved" : "No description")}</p>
                <div className="flex justify-end">
                  {confirmId === p.id ? (
                    <span className="flex items-center gap-1 text-xs">
                      <button onClick={() => remove(p.id)} className="rounded-md px-1.5 py-1 font-medium text-danger">Remove</button>
                      <button onClick={() => setConfirmId(null)} className="rounded-md px-1.5 py-1 text-ink-2">Keep</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmId(p.id)} aria-label={`Remove ${p.name}`} className="rounded-md p-1.5 text-ink-2 hover:bg-panel-2 hover:text-ink">
                      <TrashIcon width={16} height={16} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
