"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Media, Thumb } from "@/components/media";
import { PostKit } from "@/components/post-kit";
import { Select } from "@/components/select";
import { DownloadIcon } from "@/components/icons";
import { AD_STYLES } from "@/config/templates";
import { useRefreshData } from "@/lib/queries";
import { cssRatio, type CharacterCard, type ModelOption, type PresentedJob, type ProductCard } from "@/lib/ui-types";

type Props = { base: string; models: ModelOption[]; characters: CharacterCard[]; products: ProductCard[]; demo?: boolean };

const RATIOS = [
  { value: "4:5", label: "Feed post, 4:5" },
  { value: "9:16", label: "Story or reel cover, 9:16" },
  { value: "1:1", label: "Square, 1:1" },
];
const active = (j: PresentedJob) => j.status === "queued" || j.status === "running";
const label = "text-sm font-medium";

/** Product ads: one character holding one saved product, several ad styles at once, each with a caption. */
export function AdsView({ base, models, characters, products, demo }: Props) {
  const refresh = useRefreshData();
  const imageModels = useMemo(() => models.filter((m) => m.kind === "image" && m.maxRefs > 1), [models]);
  const [characterId, setCharacterId] = useState("");
  const [productId, setProductId] = useState("");
  const [hook, setHook] = useState("");
  const [styles, setStyles] = useState<string[]>(["ad-hold", "ad-use"]);
  const [ratio, setRatio] = useState("4:5");
  const [modelKey, setModelKey] = useState("");
  const [jobs, setJobs] = useState<PresentedJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const character = characters.find((c) => c.id === characterId) ?? characters[0] ?? null;
  const product = products.find((p) => p.id === productId) ?? products[0] ?? null;
  const model = imageModels.find((m) => m.key === modelKey) ?? imageModels.find((m) => m.key === "nano-banana-2.1") ?? imageModels[0];
  const total = (model?.credits ?? 0) * styles.length;
  const short = !!model && total > model.available;
  const canRun = !!character && !!product && !!model && !model.paused && styles.length > 0 && !short && !busy;
  const open = jobs.find((j) => j.id === openId) ?? jobs.find((j) => j.status === "succeeded") ?? null;

  function toggle(id: string) {
    setStyles((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function generate() {
    if (!canRun || !character || !product || !model) return;
    setBusy(true);
    setError(null);
    setJobs([]);
    const productText = product.pitch ? `${product.name}, ${product.pitch}` : product.name;
    const results = await Promise.all(
      styles.map(async (id) => {
        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ modelKey: model.key, templateId: id, blanks: { product: productText, hook: hook.trim() }, characterId: character.id, productId: product.id, aspectRatio: ratio }),
          });
          const body = await res.json();
          return res.ok ? { job: body.job as PresentedJob } : { error: (body.error as string) ?? "Something went wrong." };
        } catch {
          return { error: "Something went wrong." };
        }
      }),
    );
    const made = results.flatMap((r) => ("job" in r && r.job ? [r.job] : []));
    const failed = results.find((r) => "error" in r);
    setJobs(made);
    setOpenId(made.find((j) => j.status === "succeeded")?.id ?? null);
    const why = failed && "error" in failed ? (failed.error ?? "Something went wrong.") : null;
    if (why) setError(made.length ? `${made.length} of ${styles.length} ads were made. ${why}` : why);
    setBusy(false);
    refresh();
  }

  // An image model that answers late is polled until it settles.
  useEffect(() => {
    if (demo || !jobs.some(active)) return;
    const t = setTimeout(async () => {
      const next = await Promise.all(jobs.map(async (j) => (active(j) ? ((await (await fetch(`/api/jobs/${j.id}`)).json()).job as PresentedJob) : j)));
      setJobs(next);
      if (!next.some(active)) refresh();
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  if (characters.length === 0 || products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 lg:px-10 lg:py-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Product ads</h1>
        <p className="mt-3 text-sm text-ink-2">
          An ad needs a character and a saved product. {characters.length === 0 && <Link href={`${base}/characters`} className="font-medium text-accent hover:underline">Make a character</Link>}
          {characters.length === 0 && products.length === 0 && " and "}
          {products.length === 0 && <Link href={`${base}/products`} className="font-medium text-accent hover:underline">save a product</Link>}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-10 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Product ads</h1>
      <div className="mt-8 grid gap-5 rounded-3xl border border-line bg-panel p-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className={label}>Character</p>
            <Select ariaLabel="Character" value={character?.id ?? ""} onChange={setCharacterId} options={characters.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
          <div className="space-y-2">
            <p className={label}>Product</p>
            <Select ariaLabel="Product" value={product?.id ?? ""} onChange={setProductId} options={products.map((p) => ({ value: p.id, label: p.name }))} />
            {product?.photoUrl && (
              <div className="flex items-center gap-3 text-xs text-ink-2">
                <Thumb src={product.photoUrl} alt={product.name} className="size-14 rounded-xl object-cover" />
                <span>{product.pitch || product.name}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="ad-hook" className={label}>
              What to highlight <span className="font-normal text-ink-2">(optional)</span>
            </label>
            <input id="ad-hook" value={hook} onChange={(e) => setHook(e.target.value)} maxLength={150} placeholder="Brightens skin in two weeks" className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className={label}>Ad styles</p>
            <ul className="grid grid-cols-2 gap-2">
              {AD_STYLES.map((s) => {
                const on = styles.includes(s.id);
                return (
                  <li key={s.id}>
                    <button type="button" aria-pressed={on} onClick={() => toggle(s.id)} className={`h-full w-full rounded-xl border p-3 text-left ${on ? "border-accent bg-bg" : "border-line hover:border-ink/30"}`}>
                      <span className="block text-sm font-medium">{s.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-2">{s.blurb}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className={label}>Shape</p>
              <Select ariaLabel="Shape" value={ratio} onChange={setRatio} options={RATIOS} />
            </div>
            <div className="space-y-2">
              <p className={label}>Model</p>
              <Select ariaLabel="Model" value={model?.key ?? ""} onChange={setModelKey} options={imageModels.map((m) => ({ value: m.key, label: `${m.label}, ${m.credits} credits`, disabled: m.paused }))} />
            </div>
          </div>
        </div>

        <div className="space-y-3 md:col-span-2">
          {error && (
            <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          {short && (
            <p className="text-sm text-ink-2">
              You need {total} credits and have {model?.available}.{" "}
              <Link href={`${base}/credits`} className="font-medium text-accent hover:underline">
                Add credits
              </Link>
            </p>
          )}
          <button type="button" onClick={generate} disabled={!canRun} className="w-full rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink disabled:cursor-not-allowed disabled:opacity-40 md:w-auto">
            {busy ? "Making your ads" : styles.length === 0 ? "Pick at least one style" : `Make ${styles.length} ${styles.length === 1 ? "ad" : "ads"} for ${total} credits`}
          </button>
        </div>
      </div>

      {busy && (
        <section aria-label="Making your ads" className="mt-10" role="status" aria-live="polite">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {styles.map((id) => (
              <li key={id} className="img-shimmer overflow-hidden rounded-2xl" style={{ aspectRatio: cssRatio(ratio) }} />
            ))}
          </ul>
          <p className="mt-3 text-center text-sm text-ink-2">Making {styles.length} {styles.length === 1 ? "ad" : "ads"}. This takes about half a minute.</p>
        </section>
      )}

      {jobs.length > 0 && (
        <section aria-label="Your ads" className="mt-10 space-y-6">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {jobs.map((j) => (
              <li key={j.id}>
                <button type="button" onClick={() => setOpenId(j.id)} aria-pressed={open?.id === j.id} disabled={j.status !== "succeeded"} className={`block w-full overflow-hidden rounded-2xl border-2 bg-panel-2 ${open?.id === j.id ? "border-accent" : "border-transparent"}`} style={{ aspectRatio: cssRatio(ratio) }}>
                  {j.status === "succeeded" && j.outputs[0] ? <Thumb src={j.outputs[0].thumbUrl ?? j.outputs[0].url} alt={j.prompt} className="size-full object-cover" /> : <span className="grid size-full place-items-center px-2 text-center text-xs text-ink-2">{active(j) ? "Making it" : "Failed, credits refunded"}</span>}
                </button>
              </li>
            ))}
          </ul>
          {open?.outputs[0] && (
            <div className="flex flex-col items-center gap-4">
              <div style={{ aspectRatio: cssRatio(ratio), height: "min(60vh, 560px)", maxWidth: "100%" }} className="overflow-hidden rounded-[28px] border border-line bg-panel-2">
                <Media output={open.outputs[0]} alt={open.prompt} controls className="size-full object-cover" />
              </div>
              <a href={open.outputs[0].downloadUrl} className="flex items-center gap-2 rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2">
                <DownloadIcon width={18} height={18} /> Download
              </a>
              <PostKit jobId={open.id} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
