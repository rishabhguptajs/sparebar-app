"use client";

import { useEffect, useState } from "react";

type Kit = { caption: string; hashtags: string[] };

/** Caption and hashtags for a finished result, written in the character's voice. */
export function PostKit({ jobId }: { jobId: string }) {
  const [kit, setKit] = useState<Kit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // A new result starts with no caption.
  useEffect(() => {
    setKit(null);
    setError(null);
  }, [jobId]);

  async function write() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/postkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not write a caption.");
      setKit(body.kit as Kit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not write a caption.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!kit) return;
    try {
      await navigator.clipboard.writeText(`${kit.caption}\n\n${kit.hashtags.map((h) => `#${h}`).join(" ")}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: the text is on screen to select
    }
  }

  if (!kit) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button type="button" onClick={write} disabled={busy} className="rounded-xl bg-panel px-4 py-2.5 text-sm font-medium hover:bg-panel-2 disabled:opacity-40">
          {busy ? "Writing" : "Write a caption"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="studio-reveal w-full max-w-md space-y-2 rounded-2xl border border-line bg-panel p-4 text-sm">
      <p className="leading-relaxed">{kit.caption}</p>
      <p className="text-ink-2">{kit.hashtags.map((h) => `#${h}`).join(" ")}</p>
      <button type="button" onClick={copy} className="text-sm font-medium text-accent hover:underline">
        {copied ? "Copied" : "Copy caption"}
      </button>
    </div>
  );
}
