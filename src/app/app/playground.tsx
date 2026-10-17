"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PresentedJob } from "@/lib/jobs/present";

type ModelOption = { key: string; label: string; kind: "image" | "video"; credits: number };

export function Playground({ models }: { models: ModelOption[] }) {
  const router = useRouter();
  const [modelKey, setModelKey] = useState(models[0]?.key ?? "");
  const [prompt, setPrompt] = useState("");
  const [job, setJob] = useState<PresentedJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setJob(null);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelKey, prompt }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "Something went wrong.");
    setJob(body.job);
    router.refresh();
  }

  // Poll while running. Each poll can also advance the job on the server.
  useEffect(() => {
    if (!job || (job.status !== "running" && job.status !== "queued")) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/jobs/${job.id}`);
      if (res.ok) {
        const next = (await res.json()).job as PresentedJob;
        setJob(next);
        if (next.status === "succeeded" || next.status === "failed") router.refresh();
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [job, router]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form onSubmit={generate} className="flex flex-col gap-3">
        <select
          value={modelKey}
          onChange={(e) => setModelKey(e.target.value)}
          className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
        >
          {models.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label} ({m.kind}, {m.credits} credits)
            </option>
          ))}
        </select>
        <textarea
          required
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the shot"
          className="rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
        />
        <button disabled={busy} className="rounded-lg bg-foreground text-background px-3 py-2 font-medium disabled:opacity-60">
          {busy ? "Starting" : "Generate"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {job && (
        <section className="rounded-xl border border-black/10 dark:border-white/10 p-4">
          <p className="text-sm opacity-70">
            {job.modelLabel} · {job.status}
          </p>
          {job.error && <p className="mt-2 text-sm text-red-600">{job.error}</p>}
          <div className="mt-3 grid gap-3">
            {job.outputs.map((o) =>
              o.mime.startsWith("video/") ? (
                <video key={o.url} src={o.url} controls className="w-full rounded-lg" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={o.url} src={o.url} alt={job.prompt} className="w-full rounded-lg" />
              ),
            )}
            {job.outputs.map((o, i) => (
              <a key={`d${i}`} href={o.downloadUrl} className="text-sm underline">
                Download {i + 1}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
