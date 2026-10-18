"use client";

import { creditsFor, resolutionHint } from "@/lib/options";
import { ModelPicker } from "@/components/model-picker";
import { useRefreshData } from "@/lib/queries";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CloseIcon,
  DownloadIcon,
  ImageIcon,
  PlayIcon,
  PlusIcon,
  RerunIcon,
  VideoIcon,
} from "@/components/icons";
import { Media, Thumb } from "@/components/media";
import { PostKit } from "@/components/post-kit";
import { NewCharacterDialog } from "@/components/new-character-dialog";
import {
  RATIOS,
  cssRatio,
  type CharacterCard,
  type ModelOption,
  type PresentedJob,
} from "@/lib/ui-types";

type Initial = {
  modelKey?: string;
  prompt?: string;
  characterId?: string;
  aspectRatio?: string;
};

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

const active = (j: PresentedJob | null) =>
  j?.status === "queued" || j?.status === "running";

export function StudioView({
  base,
  models,
  characters: charactersProp,
  recent: recentProp,
  initial,
  notice,
  demo,
}: Props) {
  const refresh = useRefreshData();
  // Characters made from this page show at once, before the list refetches.
  const [added, setAdded] = useState<CharacterCard[]>([]);
  const characters = useMemo(
    () => [
      ...charactersProp,
      ...added.filter((a) => !charactersProp.some((c) => c.id === a.id)),
    ],
    [charactersProp, added],
  );
  const [creating, setCreating] = useState(false);
  const portraitCredits =
    models.find((m) => m.key === "nano-banana-2.1")?.credits ?? 2;
  const startModel =
    models.find((m) => m.key === initial?.modelKey) ?? models[0];

  const [kind, setKind] = useState<"image" | "video">(
    startModel?.kind ?? "image",
  );
  const [modelKey, setModelKey] = useState(startModel?.key ?? "");
  const [characterId, setCharacterId] = useState<string | null>(
    initial?.characterId ?? null,
  );
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [ratio, setRatio] = useState<string>(initial?.aspectRatio ?? "9:16");
  const [resolution, setResolution] = useState<string | null>(
    startModel?.defaultResolution ?? null,
  );
  const [seconds, setSeconds] = useState<number | null>(
    startModel?.defaultSeconds ?? null,
  );
  const [job, setJob] = useState<PresentedJob | null>(null);
  const [recent, setRecent] = useState(recentProp);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showNotice, setShowNotice] = useState(!!notice);

  const model = models.find((m) => m.key === modelKey);
  const kindModels = useMemo(
    () => models.filter((m) => m.kind === kind),
    [models, kind],
  );
  // Each model starts at its own default quality and length.
  useEffect(() => {
    const m = models.find((x) => x.key === modelKey);
    setResolution(m?.defaultResolution ?? null);
    setSeconds(m?.defaultSeconds ?? null);
  }, [modelKey, models]);
  const character = characters.find((c) => c.id === characterId) ?? null;
  const cost = model ? creditsFor(model, resolution, seconds) : 0;
  const short = !!model && cost > model.available;
  const running = active(job);
  const canRun =
    !!model &&
    !model.paused &&
    prompt.trim().length >= 3 &&
    !busy &&
    !running &&
    !short;

  function pickKind(next: "image" | "video") {
    setKind(next);
    if (model?.kind !== next)
      setModelKey(models.find((m) => m.kind === next)?.key ?? "");
  }

  function loadSettings(j: PresentedJob) {
    setKind(j.kind);
    if (models.some((m) => m.key === j.modelKey)) setModelKey(j.modelKey);
    setPrompt(j.prompt);
    if (j.aspectRatio) setRatio(j.aspectRatio);
    setCharacterId(
      j.characterId && characters.some((c) => c.id === j.characterId)
        ? j.characterId
        : null,
    );
  }

  function finish(next: PresentedJob) {
    setJob(next);
    if (next.status === "succeeded")
      setRecent((r) =>
        [next, ...r.filter((x) => x.id !== next.id)].slice(0, 14),
      );
    refresh();
  }

  async function generate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canRun || !model) return;
    setBusy(true);
    setError(null);
    setJob(null);

    if (demo) {
      const pending = {
        ...demo,
        id: `demo-${Date.now()}`,
        status: "running" as const,
        outputs: [],
        prompt,
        kind: model.kind,
      };
      setJob(pending);
      setBusy(false);
      setTimeout(
        () =>
          finish({
            ...demo,
            id: pending.id,
            prompt,
            kind: model.kind,
            status: "succeeded",
          }),
        3200,
      );
      return;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelKey,
          prompt,
          aspectRatio: ratio,
          resolution: resolution ?? undefined,
          seconds: model.kind === "video" ? (seconds ?? undefined) : undefined,
          characterId: characterId ?? undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      if (active(body.job)) {
        setJob(body.job);
        refresh();
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
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [running]);

  const landscape = (() => {
    const [w, h] = ratio.split(":").map(Number);
    return w > h;
  })();
  const frameStyle: React.CSSProperties = landscape
    ? { aspectRatio: cssRatio(ratio), width: "min(100%, 720px)" }
    : {
        aspectRatio: cssRatio(ratio),
        height: "min(52vh, 560px)",
        maxWidth: "100%",
      };

  const [open, setOpen] = useState<
    "model" | "character" | "ratio" | "quality" | "length" | null
  >(null);
  const bar = useRef<HTMLDivElement>(null);
  const promptBox = useRef<HTMLTextAreaElement>(null);

  // Close a popover on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) setOpen(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  // Grow the prompt box with its text, up to a limit.
  useEffect(() => {
    const el = promptBox.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [prompt]);

  const toggle = (
    name: "model" | "character" | "ratio" | "quality" | "length",
  ) => setOpen((o) => (o === name ? null : name));

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Results */}
      <section
        aria-label="Result"
        className="flex min-w-0 flex-1 flex-col items-center gap-6 px-5 pb-6 pt-8 lg:px-10"
      >
        <div className="w-full max-w-3xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Studio
          </h1>
        </div>

        {notice && showNotice && (
          <div
            role="status"
            className="flex w-full max-w-3xl items-start gap-3 rounded-xl border border-accent/50 bg-panel px-4 py-3 text-sm"
          >
            <p className="flex-1">{notice}</p>
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              aria-label="Dismiss"
              className="text-ink-2 hover:text-ink"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        )}

        <div className="flex w-full flex-1 items-center justify-center">
          <div
            style={frameStyle}
            className="relative isolate flex items-center justify-center overflow-hidden rounded-[28px] border border-line bg-panel-2"
          >
            {!job && (
              <p className="max-w-[16rem] px-6 text-center text-sm text-ink-2">
                Your {kind} appears here.{" "}
                {character
                  ? `${character.name} will carry through.`
                  : "Pick a character to keep a consistent face."}
              </p>
            )}

            {running && (
              <div className="sweep absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden px-6 text-center">
                <p className="relative z-10 font-display text-2xl font-semibold">
                  Generating
                </p>
                <p className="relative z-10 text-sm tabular-nums text-ink-2">
                  {Math.floor(elapsed / 60)}:
                  {String(elapsed % 60).padStart(2, "0")}
                </p>
                {job?.kind === "video" && (
                  <p className="relative z-10 max-w-[15rem] text-xs text-ink-2">
                    Video can take a few minutes. You can leave this page and
                    find it in your library.
                  </p>
                )}
              </div>
            )}

            {job?.status === "succeeded" && job.outputs[0] && (
              <div key={job.id} className="studio-reveal size-full">
                <Media
                  output={job.outputs[0]}
                  alt={job.prompt}
                  controls
                  className="size-full object-cover"
                />
              </div>
            )}

            {job?.status === "failed" && (
              <p className="max-w-[16rem] px-6 text-center text-sm text-danger">
                {job.error ?? "Generation failed. Your credits were refunded."}{" "}
                Try a different prompt or model.
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
            <button
              type="button"
              onClick={() => {
                promptBox.current?.focus();
                promptBox.current?.setSelectionRange(
                  prompt.length,
                  prompt.length,
                );
              }}
              className="rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2"
            >
              Edit prompt
            </button>
            {character && (
              <button
                type="button"
                onClick={() => {
                  setPrompt("");
                  setJob(null);
                  promptBox.current?.focus();
                }}
                className="rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2"
              >
                New shot with {character.name}
              </button>
            )}
          </div>
        )}

        {job?.status === "succeeded" && !demo && <PostKit jobId={job.id} />}

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
                    className={`relative block h-24 overflow-hidden rounded-xl border transition-colors ${job?.id === j.id ? "border-accent" : "border-line"}`}
                    style={{ aspectRatio: cssRatio(j.aspectRatio) }}
                  >
                    {j.outputs[0] && (
                      <Thumb
                        src={j.outputs[0].url}
                        alt=""
                        className="size-full object-cover"
                      />
                    )}
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

      {/* Composer: one box, with the choices as small buttons under the prompt. */}
      <form
        onSubmit={generate}
        className="sticky bottom-[4.5rem] z-10 mx-auto w-full max-w-3xl px-3 pb-3 md:bottom-0 md:px-5 md:pb-5"
      >
        {error && (
          <p
            role="alert"
            className="mb-2 rounded-xl border border-danger/40 bg-bg px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        {short && (
          <p className="mb-2 rounded-xl bg-bg px-4 py-2.5 text-sm text-ink-2 shadow-[0_0_0_1px_var(--line)]">
            {model?.kind === "video" && model.available === 0
              ? "Free credits work for images only. Add credits to make video."
              : `You need ${cost} credits for this and have ${model?.available}.`}{" "}
            <Link
              href={`${base}/credits`}
              className="font-medium text-accent hover:underline"
            >
              Add credits
            </Link>
          </p>
        )}

        <div
          ref={bar}
          className="relative rounded-3xl border border-line bg-bg p-3 shadow-[0_12px_40px_-12px_rgba(20,20,60,0.18)] transition-colors focus-within:border-accent has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-accent/30"
        >
          <label htmlFor="prompt" className="sr-only">
            Prompt
          </label>
          <textarea
            ref={promptBox}
            id="prompt"
            rows={2}
            maxLength={4000}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
            }}
            placeholder="Unboxing a skincare set on a bright bathroom counter, handheld, natural light"
            className="block w-full resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed placeholder:text-ink-2/70 bare-focus"
          />

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none]">
              <div
                className="flex shrink-0 rounded-full bg-panel p-0.5"
                role="radiogroup"
                aria-label="Type"
              >
                {(["image", "video"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={kind === k}
                    onClick={() => pickKind(k)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      kind === k
                        ? "bg-bg text-ink shadow-[0_1px_0_var(--line)]"
                        : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    {k === "image" ? (
                      <ImageIcon width={16} height={16} />
                    ) : (
                      <VideoIcon width={16} height={16} />
                    )}
                    {k === "image" ? "Image" : "Video"}
                  </button>
                ))}
              </div>

              <Pill
                active={open === "model"}
                onClick={() => toggle("model")}
                label="Model"
              >
                {model ? model.label : "Choose model"}
              </Pill>
              <Pill
                active={open === "character"}
                onClick={() => toggle("character")}
                label="Character"
              >
                {character ? character.name : "No character"}
              </Pill>
              <Pill
                active={open === "ratio"}
                onClick={() => toggle("ratio")}
                label="Shape"
              >
                {ratio}
              </Pill>
              {model && model.resolutions.length > 1 && (
                <Pill
                  active={open === "quality"}
                  onClick={() => toggle("quality")}
                  label="Quality"
                >
                  {resolution}
                </Pill>
              )}
              {model && model.durations.length > 1 && (
                <Pill
                  active={open === "length"}
                  onClick={() => toggle("length")}
                  label="Length"
                >
                  {seconds}s
                </Pill>
              )}
            </div>

            <button
              disabled={!canRun}
              className="shrink-0 rounded-full bg-accent max-sm:w-full px-5 py-2.5 text-sm font-semibold text-accent-ink transition-[opacity,transform] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy || running
                ? "Generating"
                : `Generate${model ? ` · ${cost}` : ""}`}
            </button>
          </div>

          {open === "model" && (
            <div className="pop absolute bottom-full left-0 mb-2 w-[min(32rem,100%)] rounded-3xl border border-line bg-bg p-2 shadow-[0_20px_60px_-16px_rgba(20,20,60,0.3)]">
              {kindModels.length === 0 ? (
                <p className="p-3 text-sm text-ink-2">
                  No models are available for this type yet.
                </p>
              ) : (
                <ModelPicker
                  models={kindModels}
                  selected={modelKey}
                  onSelect={(key) => {
                    setModelKey(key);
                    setOpen(null);
                  }}
                />
              )}
            </div>
          )}

          {open === "character" && (
            <div
              className="pop absolute bottom-full left-0 mb-2 w-72 max-w-full rounded-3xl border border-line bg-bg p-2 shadow-[0_20px_60px_-16px_rgba(20,20,60,0.3)]"
              role="radiogroup"
              aria-label="Character"
            >
              <CharRow
                label="No character"
                selected={characterId === null}
                onClick={() => {
                  setCharacterId(null);
                  setOpen(null);
                }}
              />
              {characters.map((c) => (
                <CharRow
                  key={c.id}
                  label={c.name}
                  cover={c.coverUrl}
                  selected={characterId === c.id}
                  onClick={() => {
                    setCharacterId(c.id);
                    setOpen(null);
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(null);
                  setCreating(true);
                }}
                className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-ink-2 hover:bg-panel hover:text-ink"
              >
                <span className="grid size-8 place-items-center rounded-full border border-dashed border-line">
                  <PlusIcon width={16} height={16} />
                </span>
                New character
              </button>
            </div>
          )}

          {open === "quality" && model && (
            <div
              className="pop absolute bottom-full left-0 mb-2 w-[min(20rem,100%)] rounded-3xl border border-line bg-bg p-2 shadow-[0_20px_60px_-16px_rgba(20,20,60,0.3)]"
              role="radiogroup"
              aria-label="Quality"
            >
              {model.resolutions.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={resolution === r.value}
                  onClick={() => {
                    setResolution(r.value);
                    // Some resolutions only work at one length.
                    if (r.seconds) setSeconds(r.seconds);
                    setOpen(null);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${resolution === r.value ? "bg-panel" : "hover:bg-panel/60"}`}
                >
                  <span className="flex-1">
                    <span className="block text-[15px] font-medium">
                      {r.value}
                    </span>
                    <span className="block text-[13px] text-ink-2">
                      {resolutionHint(r.value)}
                      {r.seconds
                        ? `${resolutionHint(r.value) ? ", " : ""}${r.seconds} seconds only`
                        : ""}
                    </span>
                  </span>
                  <span className="text-right tabular-nums">
                    <span
                      className={`block text-[15px] font-semibold ${resolution === r.value ? "text-accent" : ""}`}
                    >
                      {creditsFor(model, r.value, seconds)}
                    </span>
                    <span className="block text-[11px] text-ink-2">
                      credits
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {open === "length" && model && (
            <div
              className="pop absolute bottom-full left-0 mb-2 w-[min(20rem,100%)] rounded-3xl border border-line bg-bg p-2 shadow-[0_20px_60px_-16px_rgba(20,20,60,0.3)]"
              role="radiogroup"
              aria-label="Length"
            >
              {model.durations.map((d) => {
                const locked = model.resolutions.find(
                  (r) => r.value === resolution,
                )?.seconds;
                const blocked = !!locked && locked !== d;
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={seconds === d}
                    disabled={blocked}
                    title={
                      blocked
                        ? "This quality only makes 8 second clips. Pick a lower quality for other lengths."
                        : undefined
                    }
                    onClick={() => {
                      setSeconds(d);
                      setOpen(null);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${seconds === d ? "bg-panel" : "hover:bg-panel/60"}`}
                  >
                    <span className="flex-1 text-[15px] font-medium">
                      {d} seconds
                    </span>
                    <span className="text-right tabular-nums">
                      <span
                        className={`block text-[15px] font-semibold ${seconds === d ? "text-accent" : ""}`}
                      >
                        {creditsFor(model, resolution, d)}
                      </span>
                      <span className="block text-[11px] text-ink-2">
                        credits
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {open === "ratio" && (
            <div
              className="pop absolute bottom-full left-0 mb-2 flex gap-2 rounded-3xl border border-line bg-bg p-3 shadow-[0_20px_60px_-16px_rgba(20,20,60,0.3)]"
              role="radiogroup"
              aria-label="Aspect ratio"
            >
              {RATIOS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={ratio === r}
                  onClick={() => {
                    setRatio(r);
                    setOpen(null);
                  }}
                  className={`flex w-16 flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-xs tabular-nums transition-colors ${
                    ratio === r
                      ? "border-accent bg-panel text-ink"
                      : "border-line text-ink-2 hover:text-ink"
                  }`}
                >
                  <span
                    className="block rounded-[4px] border-2 border-current"
                    style={{ aspectRatio: cssRatio(r), height: 28 }}
                  />
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      <NewCharacterDialog
        open={creating}
        onClose={() => setCreating(false)}
        portraitCredits={portraitCredits}
        demo={!!demo}
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

function Pill({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="true"
      aria-expanded={active}
      title={label}
      className={`max-w-[11rem] shrink-0 truncate rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-accent bg-panel text-ink"
          : "border-line text-ink hover:bg-panel"
      }`}
    >
      {children}
    </button>
  );
}

function CharRow({
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
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:bg-panel ${selected ? "bg-panel" : ""}`}
    >
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-panel-2 text-ink-2">
        {cover ? (
          <Thumb src={cover} alt="" className="size-full object-cover" />
        ) : (
          label.slice(0, 1)
        )}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
