"use client";

import { useMemo, useState } from "react";
import { TOP_PICKS } from "@/config/model-meta";
import { MakerMark } from "@/components/maker-mark";
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

/** The model list: one quiet column, top picks first, with search and a price filter. */
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
      <div className="flex items-center gap-3 px-2 pb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search models"
          className="bare-focus min-w-0 flex-1 bg-transparent py-1.5 text-[15px] placeholder:text-ink-2"
        />
        <div
          className="flex shrink-0 gap-3 text-xs"
          role="group"
          aria-label="Price"
        >
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tier === t.id}
              onClick={() => setTier(t.id)}
              className={`transition-colors ${tier === t.id ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[52vh] overflow-y-auto border-t border-line pt-2">
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
            title={top.length > 0 ? "More" : undefined}
            models={rest}
            selected={selected}
            onSelect={onSelect}
          />
        )}
        {top.length + rest.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-ink-2">
            Nothing matches. Clear the search or the price filter.
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
    <section className="pb-2">
      {title && <h3 className="px-3 pb-1 pt-2 text-xs text-ink-2">{title}</h3>}
      <div role="radiogroup" aria-label={title ?? "Models"}>
        {models.map((m) => {
          const on = m.key === selected;
          const sound = m.tags.includes("Sound");
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={m.paused}
              title={m.tags.join(", ")}
              onClick={() => onSelect(m.key)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "bg-panel" : "hover:bg-panel/60"}`}
            >
              <MakerMark maker={m.maker} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[15px] font-medium">
                  <span className="truncate">{m.label}</span>
                  {sound && (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5 shrink-0 text-ink-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-label="Makes sound"
                    >
                      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" />
                      <path d="M16 9a4 4 0 010 6" />
                    </svg>
                  )}
                </span>
                <span className="block truncate text-[13px] text-ink-2">
                  {m.paused ? "Temporarily unavailable" : m.blurb}
                </span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span
                  className={`block text-[15px] font-semibold ${on ? "text-accent" : ""}`}
                >
                  {m.credits}
                </span>
                <span className="block text-[11px] text-ink-2">credits</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
