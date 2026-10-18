"use client";

import { useMemo, useState } from "react";
import { TOP_PICKS } from "@/config/model-meta";
import { ModelArt } from "@/components/model-art";
import type { ModelOption } from "@/lib/ui-types";

type Props = {
  models: ModelOption[];
  selected: string;
  onSelect: (key: string) => void;
};

const TIERS = [
  { id: "all", label: "All" },
  { id: "budget", label: "Low cost" },
  { id: "standard", label: "Balanced" },
  { id: "premium", label: "Top quality" },
] as const;

/** The model list: top picks first, then everything else, with search and a price filter. */
export function ModelPicker({ models, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<(typeof TIERS)[number]["id"]>("all");

  const { top, rest } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = models
      .filter(
        (m) =>
          (tier === "all" || m.tier === tier) &&
          (!q ||
            `${m.label} ${m.maker} ${m.tags.join(" ")}`
              .toLowerCase()
              .includes(q)),
      )
      .sort((a, b) => a.rank - b.rank);
    // While searching or filtering, one flat list reads better than two sections.
    if (q || tier !== "all") return { top: [] as ModelOption[], rest: list };
    return {
      top: list.filter((m) => m.rank <= TOP_PICKS),
      rest: list.filter((m) => m.rank > TOP_PICKS),
    };
  }, [models, query, tier]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-1 pb-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models"
          aria-label="Search models"
          className="bare-focus min-w-0 flex-1 rounded-full border border-line bg-panel px-4 py-2 text-sm"
        />
        <div className="flex gap-1" role="group" aria-label="Price">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tier === t.id}
              onClick={() => setTier(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${tier === t.id ? "bg-ink text-bg" : "bg-panel text-ink-2 hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[58vh] space-y-4 overflow-y-auto px-1 pb-1">
        {top.length > 0 && (
          <Section
            title="Top picks"
            models={top}
            selected={selected}
            onSelect={onSelect}
          />
        )}
        {rest.length > 0 && (
          <Section
            title={top.length > 0 ? "More models" : undefined}
            models={rest}
            selected={selected}
            onSelect={onSelect}
          />
        )}
        {top.length + rest.length === 0 && (
          <p className="p-3 text-sm text-ink-2">
            No models match. Clear the search or the price filter.
          </p>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  models,
  selected,
  onSelect,
}: {
  title?: string;
  models: ModelOption[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <section>
      {title && (
        <h3 className="mb-2 text-xs font-medium text-ink-2">{title}</h3>
      )}
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="radiogroup"
        aria-label={title ?? "Models"}
      >
        {models.map((m) => {
          const on = m.key === selected;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={m.paused}
              title={m.tags.join(", ")}
              onClick={() => onSelect(m.key)}
              className={`group overflow-hidden rounded-2xl border text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "border-accent" : "border-line hover:border-ink/30"}`}
            >
              <span className="relative block h-16 dark:brightness-[0.8]">
                <ModelArt
                  modelKey={m.key}
                  maker={m.maker}
                  kind={m.kind}
                  className="absolute inset-0 size-full"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#0e1018] backdrop-blur">
                  {m.credits} credits
                </span>
              </span>
              <span className="block px-3 py-2">
                <span className="block truncate text-sm font-medium">
                  {m.label}
                </span>
                <span className="line-clamp-2 min-h-8 text-xs text-ink-2">
                  {m.paused ? "Temporarily unavailable" : m.blurb}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-1">
                  {m.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-panel-2 px-1.5 py-0.5 text-[10px] text-ink-2"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
