"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon, DownloadIcon, PlusIcon, UploadIcon } from "@/components/icons";
import { Media, Thumb } from "@/components/media";
import { NewCharacterDialog } from "@/components/new-character-dialog";
import { PostKit } from "@/components/post-kit";
import { TEMPLATES, type Template } from "@/config/templates";
import { useRefreshData } from "@/lib/queries";
import { resizeImage } from "@/lib/resize-image";
import { cssRatio, type CharacterCard, type ModelOption, type PresentedJob } from "@/lib/ui-types";

type Props = { base: string; models: ModelOption[]; characters: CharacterCard[] };

const active = (j: PresentedJob | null) => j?.status === "queued" || j?.status === "running";
const field = "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm";

/** Guided flow: pick an influencer, pick a post type, fill a few blanks, generate. */
export function CreateView({ base, models, characters: charactersProp }: Props) {
  const refresh = useRefreshData();
  const [added, setAdded] = useState<CharacterCard[]>([]);
  const characters = useMemo(() => [...charactersProp, ...added.filter((a) => !charactersProp.some((c) => c.id === a.id))], [charactersProp, added]);
  const [creating, setCreating] = useState(false);
  const portraitCredits = models.find((m) => m.key === "nano-banana-2.1")?.credits ?? 2;

  const [characterId, setCharacterId] = useState<string | null>(null);
  const [kind, setKind] = useState<"image" | "video">("image");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [modelKey, setModelKey] = useState("");
  const [product, setProduct] = useState<{ key: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<PresentedJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const character = characters.find((c) => c.id === (characterId ?? characters[0]?.id)) ?? null;
  const template = TEMPLATES.find((t) => t.id === templateId) ?? null;
  const kindModels = models.filter((m) => template && m.kind === template.kind);
  const model = models.find((m) => m.key === modelKey) ?? kindModels.find((m) => m.key === template?.modelKey) ?? kindModels[0];
  const short = !!model && model.credits > model.available;
  const running = active(job);
  const missing = template?.blanks.some((b) => !b.optional && !(values[b.key] ?? "").trim());
  const canRun = !!character && !!template && !!model && !model.paused && !missing && !busy && !running && !short && !uploading;

  function pickTemplate(t: Template) {
    setTemplateId(t.id);
    setValues({});
    setModelKey(models.find((m) => m.key === t.modelKey && m.kind === t.kind)?.key ?? models.find((m) => m.kind === t.kind)?.key ?? "");
    setProduct(null);
    setJob(null);
    setError(null);
  }

  async function addProduct(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const small = await resizeImage(file);
      const body = new FormData();
      body.set("photo", small);
      const res = await fetch("/api/uploads/product", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not upload the photo.");
      setProduct({ key: data.key, preview: URL.createObjectURL(small) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  }

  async function generate() {
    if (!canRun || !character || !template || !model) return;
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelKey: model.key,
          prompt: template.scene(values, character.name),
          aspectRatio: template.aspectRatio,
          characterId: character.id,
          productKey: template.kind === "image" ? product?.key : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setJob(body.job);
      refresh();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Poll a running job. Each poll can also move the job forward on the server.
  useEffect(() => {
    if (!job || !active(job)) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/jobs/${job.id}`);
      if (!res.ok) return;
      const next = (await res.json()).job as PresentedJob;
      setJob(next);
      if (!active(next)) refresh();
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  useEffect(() => {
    if (!running) return setElapsed(0);
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const visible = TEMPLATES.filter((t) => t.kind === kind);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create a post</h1>
      <p className="mt-1 max-w-lg text-sm text-ink-2">Pick your influencer and a post type. We write the scene, you fill in a few details.</p>

      {/* 1 */}
      <section className="mt-10" aria-label="Influencer">
        <h2 className="text-sm font-medium">1. Influencer</h2>
        <div className="mt-3 flex gap-4 overflow-x-auto pb-1">
          {characters.map((c) => {
            const on = c.id === character?.id;
            return (
              <button key={c.id} type="button" onClick={() => setCharacterId(c.id)} aria-pressed={on} className={`flex w-20 shrink-0 flex-col items-center gap-1.5 text-xs ${on ? "text-ink" : "text-ink-2 hover:text-ink"}`}>
                <span className={`grid size-16 place-items-center overflow-hidden rounded-full border-2 bg-panel ${on ? "border-accent" : "border-transparent"}`}>
                  {c.coverUrl ? <Thumb src={c.coverUrl} alt="" className="size-full object-cover" /> : c.name.slice(0, 1)}
                </span>
                <span className="w-full truncate text-center">{c.name}</span>
                {c.niche && <span className="-mt-1 w-full truncate text-center text-[11px] text-ink-2">{c.niche}</span>}
              </button>
            );
          })}
          <button type="button" onClick={() => setCreating(true)} className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-xs text-ink-2 hover:text-ink">
            <span className="grid size-16 place-items-center rounded-full border border-dashed border-line">
              <PlusIcon width={20} height={20} />
            </span>
            New
          </button>
        </div>
        {characters.length === 0 && <p className="mt-3 text-sm text-ink-2">Make your first influencer to start. Upload photos, or describe them and we generate a portrait.</p>}
      </section>

      {/* 2 */}
      <section className="mt-10" aria-label="Post type">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">2. Post type</h2>
          <div className="flex rounded-full bg-panel p-0.5" role="radiogroup" aria-label="Type">
            {(["image", "video"] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${kind === k ? "bg-bg text-ink shadow-[0_1px_0_var(--line)]" : "text-ink-2 hover:text-ink"}`}>
                {k === "image" ? "Photo" : "Video"}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((t) => {
            const on = t.id === templateId;
            return (
              <li key={t.id}>
                <button type="button" onClick={() => pickTemplate(t)} aria-pressed={on} className={`block h-full w-full rounded-2xl border p-4 text-left transition-colors ${on ? "border-accent bg-panel" : "border-line hover:border-ink/30"}`}>
                  <span className="mb-3 block h-1.5 w-10 rounded-full" style={{ background: "linear-gradient(90deg,#ff4d94,#ffb38a)" }} />
                  <span className="block text-sm font-medium">{t.title}</span>
                  <span className="mt-1 block text-xs text-ink-2">{t.blurb}</span>
                  <span className="mt-3 inline-block text-[11px] tabular-nums text-ink-2" style={{ aspectRatio: cssRatio(t.aspectRatio) }}>
                    {t.aspectRatio}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3 */}
      {template && (
        <section className="studio-reveal mt-10" aria-label="Details">
          <h2 className="text-sm font-medium">3. Details</h2>
          <div className="mt-3 grid gap-5 rounded-3xl border border-line bg-panel p-5 md:grid-cols-2">
            <div className="space-y-4">
              {template.blanks.map((b) => (
                <div key={b.key} className="space-y-2">
                  <label htmlFor={`b-${b.key}`} className="text-sm font-medium">
                    {b.label} {b.optional && <span className="font-normal text-ink-2">(optional)</span>}
                  </label>
                  <input id={`b-${b.key}`} value={values[b.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [b.key]: e.target.value }))} placeholder={b.placeholder} maxLength={300} className={field} />
                </div>
              ))}

              {template.product && template.kind === "image" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Product photo <span className="font-normal text-ink-2">(optional)</span>
                  </p>
                  {product ? (
                    <div className="relative size-20 overflow-hidden rounded-xl bg-panel-2">
                      <Thumb src={product.preview} alt="Product" className="size-full object-cover" />
                      <button type="button" aria-label="Remove product photo" onClick={() => setProduct(null)} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white">
                        <CloseIcon width={12} height={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="grid size-20 cursor-pointer place-items-center rounded-xl border border-dashed border-line text-ink-2 hover:text-ink">
                      <span className="flex flex-col items-center gap-1 text-xs">
                        <UploadIcon width={18} height={18} />
                        {uploading ? "Adding" : "Add"}
                      </span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { addProduct(e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                  )}
                  <p className="text-xs text-ink-2">Shown in the photo as it is, so the label stays right.</p>
                </div>
              )}
              {template.product && template.kind === "video" && <p className="text-xs text-ink-2">Videos start from your influencer&apos;s photo. Describe the product in words.</p>}
            </div>

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label htmlFor="c-model" className="text-sm font-medium">
                  Model
                </label>
                <select id="c-model" value={model?.key ?? ""} onChange={(e) => setModelKey(e.target.value)} className={field}>
                  {kindModels.map((m) => (
                    <option key={m.key} value={m.key} disabled={m.paused}>
                      {m.label}, {m.credits} credits
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-auto space-y-3">
                {error && (
                  <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
                    {error}
                  </p>
                )}
                {short && (
                  <p className="text-sm text-ink-2">
                    {model?.kind === "video" && model.available === 0 ? "Free credits work for images only." : `You need ${model?.credits} credits and have ${model?.available}.`}{" "}
                    <Link href={`${base}/credits`} className="font-medium text-accent hover:underline">
                      Add credits
                    </Link>
                  </p>
                )}
                <button type="button" onClick={generate} disabled={!canRun} className="w-full rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink transition-[opacity,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                  {busy || running ? "Generating" : character ? `Generate for ${model?.credits ?? 0} credits` : "Pick an influencer first"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Result */}
      {job && template && (
        <section ref={resultRef} aria-label="Result" className="mt-10 flex flex-col items-center gap-5 scroll-mt-6">
          <div style={{ aspectRatio: cssRatio(template.aspectRatio), height: "min(60vh, 560px)", maxWidth: "100%" }} className="relative isolate flex items-center justify-center overflow-hidden rounded-[28px] border border-line bg-panel-2">
            {running && (
              <div className="sweep absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden px-6 text-center">
                <p className="relative z-10 font-display text-2xl font-semibold">Generating</p>
                <p className="relative z-10 text-sm tabular-nums text-ink-2">
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                </p>
                {job.kind === "video" && <p className="relative z-10 max-w-[15rem] text-xs text-ink-2">Video can take a few minutes. You can leave this page and find it in your library.</p>}
              </div>
            )}
            {job.status === "succeeded" && job.outputs[0] && (
              <div key={job.id} className="studio-reveal size-full">
                <Media output={job.outputs[0]} alt={job.prompt} controls className="size-full object-cover" />
              </div>
            )}
            {job.status === "failed" && <p className="max-w-[16rem] px-6 text-center text-sm text-danger">{job.error ?? "Generation failed. Your credits were refunded."} Try a different model.</p>}
          </div>

          {job.status === "succeeded" && job.outputs[0] && (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <a href={job.outputs[0].downloadUrl} className="flex items-center gap-2 rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2">
                  <DownloadIcon width={18} height={18} /> Download
                </a>
                <button type="button" onClick={generate} disabled={!canRun} className="rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2 disabled:opacity-40">
                  Another take
                </button>
                <button type="button" onClick={() => { setJob(null); setTemplateId(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2">
                  New post
                </button>
              </div>
              <PostKit jobId={job.id} />
            </>
          )}
        </section>
      )}

      <NewCharacterDialog
        open={creating}
        onClose={() => setCreating(false)}
        portraitCredits={portraitCredits}
        onCreated={(c) => {
          if (c) {
            setAdded((a) => [...a, c]);
            setCharacterId(c.id);
          }
          refresh();
        }}
      />
    </div>
  );
}
