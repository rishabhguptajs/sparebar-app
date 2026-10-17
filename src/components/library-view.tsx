"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { CloseIcon, DownloadIcon, PlayIcon, RerunIcon, TrashIcon } from "@/components/icons";
import { Media } from "@/components/media";
import { cssRatio, timeAgo, type PresentedJob } from "@/lib/ui-types";

type Props = { base: string; jobs: PresentedJob[]; demo?: boolean };
type Tab = "gallery" | "history";
type Filter = "all" | "image" | "video";

export function LibraryView({ base, jobs, demo }: Props) {
  const router = useRouter();
  const lightbox = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("gallery");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<PresentedJob | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const media = useMemo(
    () => jobs.filter((j) => j.status === "succeeded" && j.outputs.length > 0 && (filter === "all" || j.kind === filter)),
    [jobs, filter],
  );

  async function remove(id: string) {
    setConfirmId(null);
    setOpen(null);
    lightbox.current?.close();
    if (!demo) await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function view(j: PresentedJob) {
    setOpen(j);
    lightbox.current?.showModal();
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Library</h1>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-panel p-1" role="tablist" aria-label="Library view">
          {(["gallery", "history"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-bg text-ink shadow-[0_1px_0_var(--line)]" : "text-ink-2"}`}
            >
              {t === "gallery" ? "Gallery" : "History"}
            </button>
          ))}
        </div>

        {tab === "gallery" && (
          <div className="flex gap-1.5" role="group" aria-label="Filter">
            {(["all", "image", "video"] as const).map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${
                  filter === f ? "border-accent text-ink" : "border-line text-ink-2 hover:text-ink"
                }`}
              >
                {f === "all" ? "All" : f === "image" ? "Images" : "Videos"}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "gallery" &&
        (media.length === 0 ? (
          <Empty base={base} text={jobs.length === 0 ? "Nothing here yet." : "Nothing matches this filter."} />
        ) : (
          <ul className="mt-6 columns-2 gap-3 md:columns-4 xl:columns-5">
            {media.map((j) => (
              <li key={j.id} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-panel">
                <button
                  onClick={() => view(j)}
                  aria-label={`Open: ${j.prompt}`}
                  className="block w-full"
                  style={{ aspectRatio: cssRatio(j.aspectRatio) }}
                >
                  <Media output={j.outputs[0]} alt={j.prompt} className="size-full object-cover" />
                </button>
                {j.kind === "video" && (
                  <span className="pointer-events-none absolute left-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-black/55 text-white">
                    <PlayIcon width={13} height={13} />
                  </span>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <a
                    href={j.outputs[0].downloadUrl}
                    aria-label="Download"
                    className="pointer-events-auto grid size-8 place-items-center rounded-full bg-white/90 text-black"
                  >
                    <DownloadIcon width={16} height={16} />
                  </a>
                  <Link
                    href={`${base}?rerun=${j.id}`}
                    aria-label="Run again"
                    className="pointer-events-auto grid size-8 place-items-center rounded-full bg-white/90 text-black"
                  >
                    <RerunIcon width={16} height={16} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "history" &&
        (jobs.length === 0 ? (
          <Empty base={base} text="Nothing here yet." />
        ) : (
          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-panel">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center gap-4 px-4 py-3">
                <button
                  onClick={() => j.outputs.length > 0 && view(j)}
                  aria-label={j.outputs.length > 0 ? `Open: ${j.prompt}` : undefined}
                  disabled={j.outputs.length === 0}
                  className="size-14 shrink-0 overflow-hidden rounded-xl bg-panel-2"
                >
                  {j.outputs[0] && <Media output={j.outputs[0]} alt="" className="size-full object-cover" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{j.prompt}</p>
                  <p className="mt-0.5 text-xs text-ink-2">
                    {j.modelLabel} · {timeAgo(j.createdAt)}
                  </p>
                </div>
                <StatusChip job={j} />
                <Link
                  href={`${base}?rerun=${j.id}`}
                  aria-label="Run again"
                  className="rounded-lg p-2 text-ink-2 hover:bg-panel-2 hover:text-ink"
                >
                  <RerunIcon width={18} height={18} />
                </Link>
              </li>
            ))}
          </ul>
        ))}

      <dialog
        ref={lightbox}
        onClose={() => {
          setOpen(null);
          setConfirmId(null);
        }}
        className="m-auto max-h-[92dvh] w-[min(56rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-line bg-panel p-0"
      >
        {open && open.outputs[0] && (
          <div className="grid max-h-[92dvh] md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="grid place-items-center bg-panel-2 p-3">
              <Media output={open.outputs[0]} alt={open.prompt} controls className="max-h-[80dvh] max-w-full rounded-2xl" />
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-ink-2">
                  {open.modelLabel} · {timeAgo(open.createdAt)}
                </p>
                <button onClick={() => lightbox.current?.close()} aria-label="Close" className="rounded-lg p-1.5 text-ink-2 hover:bg-panel-2">
                  <CloseIcon width={18} height={18} />
                </button>
              </div>
              <p className="text-sm leading-relaxed">{open.prompt}</p>
              <div className="mt-auto flex flex-col gap-2">
                <a
                  href={open.outputs[0].downloadUrl}
                  className="flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink"
                >
                  <DownloadIcon width={18} height={18} /> Download
                </a>
                <Link
                  href={`${base}?rerun=${open.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-panel-2 px-4 py-2.5 text-sm font-medium"
                >
                  <RerunIcon width={18} height={18} /> Run again
                </Link>
                {confirmId === open.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => remove(open.id)} className="flex-1 rounded-xl border border-danger/50 px-4 py-2.5 text-sm font-medium text-danger">
                      Remove from library
                    </button>
                    <button onClick={() => setConfirmId(null)} className="rounded-xl px-4 py-2.5 text-sm text-ink-2">
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(open.id)}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-ink-2 hover:text-ink"
                  >
                    <TrashIcon width={16} height={16} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

function StatusChip({ job }: { job: PresentedJob }) {
  const map = {
    succeeded: ["Done", "text-ok"],
    failed: ["Refunded", "text-danger"],
    running: ["Running", "text-ink-2"],
    queued: ["Queued", "text-ink-2"],
  } as const;
  const [label, color] = map[job.status];
  return (
    <div className="hidden text-right sm:block">
      <p className={`text-sm font-medium ${color}`}>{label}</p>
      <p className="text-xs tabular-nums text-ink-2">{job.status === "failed" ? "0 credits" : `${job.credits} credits`}</p>
    </div>
  );
}

function Empty({ base, text }: { base: string; text: string }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-xl font-semibold">{text}</p>
      <Link href={base} className="mt-4 inline-block rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2">
        Make something in the studio
      </Link>
    </div>
  );
}
