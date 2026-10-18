import { creditsForCost } from "@/lib/credits";
import type { ModelOption } from "@/lib/ui-types";

/** Credits for a model at a chosen resolution and length, the same sum the server makes. */
export function creditsFor(
  model: ModelOption,
  resolution: string | null,
  seconds: number | null,
): number {
  const option = model.resolutions.find((r) => r.value === resolution);
  if (!option) return model.credits;
  const length =
    model.kind === "video"
      ? (option.seconds ?? seconds ?? model.defaultSeconds ?? 8)
      : 1;
  return creditsForCost(option.costMicros * length);
}

const HINTS: Record<string, string> = {
  "480p": "Draft",
  "720p": "HD",
  "768p": "HD",
  "1080p": "Full HD",
  "1K": "Standard",
  "2K": "High",
  "4K": "Ultra",
};
export const resolutionHint = (value: string) => HINTS[value] ?? "";
