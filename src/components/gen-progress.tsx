"use client";

const STAGES = {
  image: ["Reading your references", "Setting up the shot", "Painting the details", "Final touches"],
  video: ["Preparing your frame", "Setting the scene", "Rendering the motion", "Adding sound and polish"],
};
// Roughly how long each takes. The bar eases toward the end instead of stalling, and finishes when the result arrives.
const EXPECTED = { image: 25, video: 120 };

/** What shows while something is being made: a stage line, an easing bar and the time so far. */
export function GenProgress({ kind, elapsed }: { kind: "image" | "video"; elapsed: number }) {
  const stages = STAGES[kind];
  const expected = EXPECTED[kind];
  const stage = Math.min(stages.length - 1, Math.floor((elapsed / expected) * stages.length));
  const pct = Math.round((1 - Math.exp((-2.2 * elapsed) / expected)) * 94);
  return (
    <div className="sweep absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden px-6 text-center" role="status" aria-live="polite">
      <p className="relative z-10 font-display text-2xl font-semibold">Making your {kind === "video" ? "clip" : "photo"}</p>
      <p key={stage} className="studio-reveal relative z-10 text-sm text-ink-2">
        {stages[stage]}
      </p>
      <div className="relative z-10 h-1 w-40 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="relative z-10 text-xs tabular-nums text-ink-2">
        {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
      </p>
      {kind === "video" && <p className="relative z-10 max-w-[15rem] text-xs text-ink-2">Video can take a few minutes. You can leave this page and find it in your library.</p>}
    </div>
  );
}
