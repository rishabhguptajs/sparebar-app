"use client";

import { Select } from "@/components/select";
import { OPTION_FIELDS, PROFILE_LABELS, PROFILE_OPTIONS, type CharacterProfile } from "@/lib/prompts/profile";

const field = "w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm";

/** The structured look of a character: dropdowns for the main traits and short text for the rest. */
export function ProfileFields({ value, onChange, idPrefix }: { value: CharacterProfile; onChange: (next: CharacterProfile) => void; idPrefix: string }) {
  const set = <K extends keyof CharacterProfile>(k: K, v: CharacterProfile[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {OPTION_FIELDS.map((f) => (
          <div key={f} className="space-y-1">
            <label htmlFor={`${idPrefix}-${f}`} className="text-xs font-medium text-ink-2">
              {PROFILE_LABELS[f]}
            </label>
            <Select id={`${idPrefix}-${f}`} value={value[f]} onChange={(v) => set(f, v)} placeholder="Not set" options={[{ value: "", label: "Not set" }, ...PROFILE_OPTIONS[f].map((o) => ({ value: o, label: o }))]} />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-features`} className="text-xs font-medium text-ink-2">
          Distinguishing features
        </label>
        <input id={`${idPrefix}-features`} maxLength={120} value={value.features} onChange={(e) => set("features", e.target.value)} placeholder="Freckles, small gold hoops, round glasses" className={field} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${idPrefix}-wardrobe`} className="text-xs font-medium text-ink-2">
            Everyday style
          </label>
          <input id={`${idPrefix}-wardrobe`} maxLength={120} value={value.wardrobe} onChange={(e) => set("wardrobe", e.target.value)} placeholder="Neutral knitwear, denim, white sneakers" className={field} />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${idPrefix}-vibe`} className="text-xs font-medium text-ink-2">
            Vibe
          </label>
          <input id={`${idPrefix}-vibe`} maxLength={80} value={value.vibe} onChange={(e) => set("vibe", e.target.value)} placeholder="Warm, relaxed, girl next door" className={field} />
        </div>
      </div>
    </div>
  );
}
