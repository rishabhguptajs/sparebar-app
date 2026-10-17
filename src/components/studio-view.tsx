"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CloseIcon, DownloadIcon, ImageIcon, PlayIcon, PlusIcon, RerunIcon, VideoIcon } from "@/components/icons";
import { Media, Thumb } from "@/components/media";
import { RATIOS, cssRatio, type CharacterCard, type ModelOption, type PresentedJob } from "@/lib/ui-types";

type Initial = { modelKey?: string; prompt?: string; characterId?: string; aspectRatio?: string };

type Props = {
  base: string;
  models: ModelOption[];
  characters: CharacterCard[];
  recent: PresentedJob[];
  initial?: Initial;
  /** One-time message shown above the composer, such as the outcome of the free credits. */
  notice?: string;
  /** Preview mode: simulates a job instead of calling the API. */
  demo?: PresentedJob;
};

const active = (j: PresentedJob | null) => j?.status === "queued" || j?.status === "running";

export function StudioView({ base, models, characters, recent: recentProp, initial, notice, demo }: Props) {
  const router = useRouter();
  const startModel = models.find((m) => m.key === initial?.modelKey) ?? models[0];

  const [kind, setKind] = useState<"image" | "video">(startModel?.kind ?? "image");
  const [modelKey, setModelKey] = useState(startModel?.key ?? "");
  const [characterId, setCharacterId] = useState<string | null>(initial?.characterId ?? null);
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [ratio, setRatio] = useState<string>(initial?.aspectRatio ?? "9:16");
  const [job, setJob] = useState<PresentedJob | null>(null);
  const [recent, setRecent] = useState(recentProp);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showNotice, setShowNotice] = useState(!!notice);

  const model = models.find((m) => m.key === modelKey);
  const kindModels = useMemo(() => models.filter((m) => m.kind === kind), [models, kind]);
  const character = characters.find((c) => c.id === characterId) ?? null;
  const short = !!model && model.credits > model.available;
  const running = active(job);
  const canRun = !!model && !model.paused && prompt.trim().length >= 3 && !busy && !running && !short;

  function pickKind(next: "image" | "video") {
    setKind(next);
    if (model?.kind !== next) setModelKey(models.find((m) => m.kind === next)?.key ?? "");
  }

  function loadSettings(j: PresentedJob) {
    setKind(j.kind);
    if (models.some((m) => m.key === j.modelKey)) setModelKey(j.modelKey);
    setPrompt(j.prompt);
    if (j.aspectRatio) setRatio(j.aspectRatio);
    setCharacterId(j.characterId && characters.some((c) => c.id === j.characterId) ? j.characterId : null);
  }

  function finish(next: PresentedJob) {
    setJob(next);
    if (next.status === "succeeded") setRecent((r) => [next, ...r.filter((x) => x.id !== next.id)].slice(0, 14));
    router.refresh();
  }

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canRun || !model) return;
    setBusy(true);
    setError(null);
    setJob(null);

    if (demo) {
      const pending = { ...demo, id: `demo-${Date.now()}`, status: "running" as const, outputs: [], prompt, kind: model.kind };
      setJob(pending);
      setBusy(false);
      setTimeout(() => finish({ ...demo, id: pending.id, prompt, kind: model.kind, status: "succeeded" }), 3200);
      return;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelKey, prompt, aspectRatio: ratio, characterId: characterId ?? undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      if (active(body.job)) {
        setJob(body.job);
        router.refresh();
      } else {
        finish(body.job);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Poll a running job. Each poll can also move the job forward on the server.
  useEffect(() => {
    if (!job || !active(job) || demo) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/jobs/${job.id}`);
      if (!res.ok) return;
      const next = (await res.json()).job as PresentedJob;
      if (active(next)) setJob(next);
      else finish(next);
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, demo]);

  useEffect(() => {
    if (!running) return setElapsed(0);
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const landscape = (() => {
    const [w, h] = ratio.split(":").map(Number);
    return w > h;
  })();
  const frameStyle: React.CSSProperties = landscape
    ? { aspectRatio: cssRatio(ratio), width: "min(100%, 760px)" }
    : { aspectRatio: cssRatio(ratio), height: "min(62vh, 640px)", maxWidth: "100%" };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[400px_minmax(0,1fr)]">
      {/* Composer */}
      <form onSubmit={generate} className="flex flex-col gap-7 border-line px-5 py-6 lg:border-r lg:px-7 lg:py-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Studio</h1>
          <p className="mt-1 text-sm text-ink-2">Describe a shot. Add a character to keep the same face across shots.</p>
        </div>

        {notice && showNotice && (
          <div role="status" className="flex items-start gap-3 rounded-xl border border-accent/50 bg-panel px-4 py-3 text-sm">
            <p className="flex-1">{notice}</p>
            <button type="button" onClick={() => setShowNotice(false)} aria-label="Dismiss" className="text-ink-2 hover:text-ink">
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="sr-only">Type</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-panel p-1" role="radiogroup" aria-label="Type">
            {(["image", "video"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => pickKind(k)}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                  kind === k ? "bg-bg text-ink shadow-[0_1px_0_var(--line)]" : "text-ink-2 hover:text-ink"
                }`}
              >
                {k === "image" ? <ImageIcon width={18} height={18} /> : <VideoIcon width={18} height={18} />}
                {k === "image" ? "Image" : "Video"}
              </button>
            ))}
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Model">
            {kindModels.length === 0 && <p className="text-sm text-ink-2">No models are available for this type yet.</p>}
            {kindModels.map((m) => {
              const on = m.key === modelKey;
              return (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setModelKey(m.key)}
                  disabled={m.paused}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    on ? "border-accent bg-panel" : "border-line bg-panel/50 hover:bg-panel"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-xs text-ink-2">{m.paused ? "Temporarily unavailable" : m.detail}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-ink-2">{m.credits} credits</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <section className="space-y-3" aria-label="Character">
          <h2 className="text-sm font-medium">Character</h2>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            <CharChoice label="None" selected={characterId === null} onClick={() => setCharacterId(null)} />
            {characters.map((c) => (
              <CharChoice
                key={c.id}
                label={c.name}
                cover={c.coverUrl}
                selected={characterId === c.id}
                onClick={() => setCharacterId(c.id)}
              />
            ))}
            <Link
              href={`${base}/characters?new=1`}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-xs text-ink-2 hover:text-ink"
            >
              <span className="grid size-14 place-items-center rounded-full border border-dashed border-line">
                <PlusIcon width={18} height={18} />
              </span>
              New
            </Link>
          </div>
        </section>

        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Prompt
          </label>
          <textarea
            id="prompt"
            rows={5}
            maxLength={4000}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Unboxing a skincare set on a bright bathroom counter, handheld, natural light"
            className="w-full resize-y rounded-xl border border-line bg-panel px-4 py-3 text-sm leading-relaxed placeholder:text-ink-2/70"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Shape</legend>
          <div className="flex gap-2" role="radiogroup" aria-label="Aspect ratio">
            {RATIOS.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={ratio === r}
                onClick={() => setRatio(r)}
                className={`rounded-lg border px-3.5 py-2 text-sm tabular-nums transition-colors ${
                  ratio === r ? "border-accent bg-panel text-ink" : "border-line text-ink-2 hover:text-ink"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-auto space-y-3">
          {error && (
            <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          {short && (
            <p className="text-sm text-ink-2">
              {model?.kind === "video" && model.available === 0
                ? "Free credits work for images only. Add credits to make video."
                : `You need ${model?.credits} credits for this and have ${model?.available}.`}{" "}
              <Link href={`${base}/credits`} className="font-medium text-accent hover:underline">
                Add credits
              </Link>
            </p>
          )}
          <button
            disabled={!canRun}
            className="w-full rounded-xl bg-accent px-5 py-3.5 text-[15px] font-semibold text-accent-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy || running ? "Generating" : `Generate${model ? ` for ${model.credits} credits` : ""}`}
          </button>
        </div>
      </form>

      {/* Canvas */}
      <section aria-label="Result" className="flex min-w-0 flex-col items-center gap-6 px-5 py-8 lg:px-10">
        <div className="flex w-full flex-1 items-center justify-center">
          <div
            style={frameStyle}
            className="relative isolate flex items-center justify-center overflow-hidden rounded-[28px] border border-line bg-panel-2"
          >
            {!job && (
              <p className="max-w-[16rem] px-6 text-center text-sm text-ink-2">
                Your {kind} appears here. {character ? `${character.name} will carry through.` : "Pick a character to keep a consistent face."}
              </p>
            )}

            {running && (
              <div className="sweep absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden px-6 text-center">
                <p className="relative z-10 font-display text-2xl font-semibold">Generating</p>
                <p className="relative z-10 text-sm tabular-nums text-ink-2">
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                </p>
                {job?.kind === "video" && (
                  <p className="relative z-10 max-w-[15rem] text-xs text-ink-2">
                    Video can take a few minutes. You can leave this page and find it in your library.
                  </p>
                )}
              </div>
            )}

            {job?.status === "succeeded" && job.outputs[0] && (
              <Media output={job.outputs[0]} alt={job.prompt} controls className="size-full object-cover" />
            )}

            {job?.status === "failed" && (
              <p className="max-w-[16rem] px-6 text-center text-sm text-danger">
                {job.error ?? "Generation failed. Your credits were refunded."} Try a different prompt or model.
              </p>
            )}
          </div>
        </div>

        {job?.status === "succeeded" && job.outputs[0] && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href={job.outputs[0].downloadUrl}
              className="flex items-center gap-2 rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2"
            >
              <DownloadIcon width={18} height={18} /> Download
            </a>
            <button
              type="button"
              onClick={() => generate()}
              disabled={!canRun}
              className="flex items-center gap-2 rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2 disabled:opacity-40"
            >
              <RerunIcon width={18} height={18} /> Run again
            </button>
          </div>
        )}

        {recent.length > 0 && (
          <div className="w-full max-w-3xl">
            <h2 className="mb-2 text-sm font-medium">Recent</h2>
            <ul className="flex gap-2.5 overflow-x-auto pb-2">
              {recent.map((j) => (
                <li key={j.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setJob(j);
                      loadSettings(j);
                    }}
                    aria-label={`Open: ${j.prompt}`}
                    className={`relative block h-24 overflow-hidden rounded-xl border ${
                      job?.id === j.id ? "border-accent" : "border-line"
                    }`}
                    style={{ aspectRatio: cssRatio(j.aspectRatio) }}
                  >
                    {j.outputs[0] && <Thumb src={j.outputs[0].url} alt="" className="size-full object-cover" />}
                    {j.kind === "video" && (
                      <span className="absolute bottom-1 right-1 grid size-5 place-items-center rounded-full bg-black/60 text-white">
                        <PlayIcon width={10} height={10} />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function CharChoice({
  label,
  cover,
  selected,
  onClick,
}: {
  label: string;
  cover?: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-16 shrink-0 flex-col items-center gap-1.5 text-xs ${selected ? "text-ink" : "text-ink-2 hover:text-ink"}`}
    >
      <span
        className={`grid size-14 place-items-center overflow-hidden rounded-full border-2 bg-panel ${
          selected ? "border-accent" : "border-transparent"
        }`}
      >
        {cover ? <Thumb src={cover} alt="" className="size-full object-cover" /> : <span className="text-ink-2">{label.slice(0, 1)}</span>}
      </span>
      <span className="w-full truncate text-center">{label}</span>
    </button>
  );
}
