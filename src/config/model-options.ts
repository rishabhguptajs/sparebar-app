// What a person can choose per generation, and what each choice costs.
// A video resolution's costMicros is per second of video; an image resolution's is per image.
// Prices read from OpenRouter on 19 Oct 2026. Seedance bills per video token, so its per-second
// figures are estimates (width x height x 24 fps / 1024 tokens); the real cost is read from the job.
import { currentPrice, type ModelConfig } from "@/config/models";

export type ResolutionOption = {
  value: string;
  costMicros: number;
  /** Some resolutions only work at one length (Veo 1080p and 4K are 8 seconds). */
  seconds?: number;
};
export type ModelOptions = {
  resolutions: ResolutionOption[];
  durations?: number[];
};
export type Selection = { resolution?: string; seconds?: number };

export const OPTIONS: Record<string, ModelOptions> = {
  "grok-imagine-video-1.5-lite": {
    resolutions: [
      { value: "480p", costMicros: 20000 },
      { value: "720p", costMicros: 30000 },
      { value: "1080p", costMicros: 140000 },
    ],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "grok-imagine-video-1.5": {
    resolutions: [
      { value: "480p", costMicros: 80000 },
      { value: "720p", costMicros: 140000 },
      { value: "1080p", costMicros: 250000 },
    ],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "grok-imagine-video": {
    resolutions: [
      { value: "480p", costMicros: 50000 },
      { value: "720p", costMicros: 70000 },
    ],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "veo-3.1": {
    resolutions: [
      { value: "720p", costMicros: 400000 },
      { value: "1080p", costMicros: 400000, seconds: 8 },
      { value: "4K", costMicros: 600000, seconds: 8 },
    ],
    durations: [4, 6, 8],
  },
  "veo-3.1-fast": {
    resolutions: [
      { value: "720p", costMicros: 100000 },
      { value: "1080p", costMicros: 120000, seconds: 8 },
      { value: "4K", costMicros: 300000, seconds: 8 },
    ],
    durations: [4, 6, 8],
  },
  "veo-3.1-lite": {
    resolutions: [
      { value: "720p", costMicros: 50000 },
      { value: "1080p", costMicros: 80000, seconds: 8 },
    ],
    durations: [4, 6, 8],
  },
  "kling-v3-std": {
    resolutions: [{ value: "720p", costMicros: 126000 }],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "kling-v3-pro": {
    resolutions: [{ value: "720p", costMicros: 168000 }],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "kling-video-o1": {
    resolutions: [{ value: "720p", costMicros: 112000 }],
    durations: [5, 10],
  },
  "wan-3.0": {
    resolutions: [
      { value: "480p", costMicros: 50000 },
      { value: "720p", costMicros: 100000 },
      { value: "1080p", costMicros: 200000 },
    ],
    durations: [4, 5, 6, 8, 10, 15, 20, 30],
  },
  "wan-3.0-prime": {
    resolutions: [
      { value: "480p", costMicros: 68000 },
      { value: "720p", costMicros: 140000 },
      { value: "1080p", costMicros: 280000 },
    ],
    durations: [4, 5, 6, 8, 10, 15, 20, 30],
  },
  "wan-2.7": {
    resolutions: [
      { value: "720p", costMicros: 100000 },
      { value: "1080p", costMicros: 100000 },
    ],
    durations: [4, 5, 6, 8, 10],
  },
  "wan-2.6": {
    resolutions: [
      { value: "720p", costMicros: 100000 },
      { value: "1080p", costMicros: 150000 },
    ],
    durations: [5, 10],
  },
  "happyhorse-1.1": {
    resolutions: [
      { value: "720p", costMicros: 98800 },
      { value: "1080p", costMicros: 127800 },
    ],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "happyhorse-1.0": {
    resolutions: [
      { value: "720p", costMicros: 98800 },
      { value: "1080p", costMicros: 169400 },
    ],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "hailuo-3": {
    resolutions: [{ value: "2K", costMicros: 130000 }],
    durations: [5, 6, 8, 10, 15],
  },
  "hailuo-3-max": {
    resolutions: [
      { value: "480p", costMicros: 50000 },
      { value: "768p", costMicros: 80000 },
    ],
    durations: [5, 6, 8, 10, 15],
  },
  "runway-gen-4.5": {
    resolutions: [{ value: "720p", costMicros: 120000 }],
    durations: [4, 5, 6, 8, 10],
  },
  "flux-3-video": {
    resolutions: [
      { value: "720p", costMicros: 170000 },
      { value: "1080p", costMicros: 290000 },
      { value: "2K", costMicros: 280000 },
      { value: "4K", costMicros: 410000 },
    ],
    durations: [5, 6, 8, 10, 15, 20],
  },
  "heygen-video": {
    resolutions: [
      { value: "480p", costMicros: 20000 },
      { value: "768p", costMicros: 36000 },
      { value: "2K", costMicros: 100000 },
    ],
    durations: [5, 6, 8, 10, 15],
  },
  "seedance-2.0": {
    resolutions: [
      { value: "480p", costMicros: 67252 },
      { value: "720p", costMicros: 151200 },
      { value: "1080p", costMicros: 374220 },
      { value: "4K", costMicros: 777600 },
    ],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "seedance-2.0-fast": {
    resolutions: [
      { value: "480p", costMicros: 40352 },
      { value: "720p", costMicros: 90720 },
    ],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "seedance-2.0-mini": {
    resolutions: [
      { value: "480p", costMicros: 33626 },
      { value: "720p", costMicros: 75600 },
    ],
    durations: [4, 5, 6, 8, 10, 15],
  },
  "seedance-2.5": {
    resolutions: [
      { value: "480p", costMicros: 102800 },
      { value: "720p", costMicros: 231120 },
    ],
    durations: [4, 5, 6, 8, 10, 15, 20, 30],
  },
  "seedance-1.5-pro": {
    resolutions: [
      { value: "480p", costMicros: 23058 },
      { value: "720p", costMicros: 51840 },
      { value: "1080p", costMicros: 116640 },
    ],
    durations: [4, 5, 6, 8, 10],
  },
  "nano-banana-2.1": {
    resolutions: [
      { value: "1K", costMicros: 33600 },
      { value: "2K", costMicros: 50400 },
      { value: "4K", costMicros: 75600 },
    ],
  },
  "nano-banana-pro": {
    resolutions: [
      { value: "1K", costMicros: 134000 },
      { value: "2K", costMicros: 134000 },
      { value: "4K", costMicros: 240000 },
    ],
  },
  "nano-banana-2": {
    resolutions: [
      { value: "1K", costMicros: 67200 },
      { value: "2K", costMicros: 100800 },
      { value: "4K", costMicros: 151200 },
    ],
  },
  "flux-3-image": {
    resolutions: [
      { value: "1K", costMicros: 48000 },
      { value: "2K", costMicros: 100000 },
      { value: "4K", costMicros: 607000 },
    ],
  },
  "flux-3-image-klein": {
    resolutions: [
      { value: "1K", costMicros: 9000 },
      { value: "2K", costMicros: 14000 },
      { value: "4K", costMicros: 36000 },
    ],
  },
  "seedream-5-pro": {
    resolutions: [
      { value: "1K", costMicros: 45000 },
      { value: "2K", costMicros: 45000 },
    ],
  },
  "qwen-image-3": {
    resolutions: [
      { value: "1K", costMicros: 36000 },
      { value: "2K", costMicros: 36000 },
    ],
  },
  "qwen-image-3-pro": {
    resolutions: [
      { value: "1K", costMicros: 40000 },
      { value: "2K", costMicros: 75000 },
    ],
  },
  "qwen-image-2.1-pro": {
    resolutions: [
      { value: "1K", costMicros: 46000 },
      { value: "2K", costMicros: 46000 },
    ],
  },
  "qwen-image-2.1-turbo": {
    resolutions: [
      { value: "1K", costMicros: 18400 },
      { value: "2K", costMicros: 18400 },
    ],
  },
  "grok-imagine-image": {
    resolutions: [
      { value: "1K", costMicros: 50000 },
      { value: "2K", costMicros: 70000 },
    ],
  },
  "riverflow-v2.5-fast": {
    resolutions: [
      { value: "1K", costMicros: 19000 },
      { value: "2K", costMicros: 21000 },
    ],
  },
  "riverflow-v2.5-pro": {
    resolutions: [
      { value: "1K", costMicros: 130000 },
      { value: "2K", costMicros: 150000 },
      { value: "4K", costMicros: 170000 },
    ],
  },
  "gpt-image-2": {
    resolutions: [
      { value: "low", costMicros: 6000 },
      { value: "medium", costMicros: 72000 },
      { value: "high", costMicros: 210000 },
    ],
  },
  "gpt-image-2.5-sunburst": {
    resolutions: [
      { value: "low", costMicros: 6000 },
      { value: "medium", costMicros: 50000 },
      { value: "high", costMicros: 210000 },
    ],
  },
  "gpt-image-2.5-flare": {
    resolutions: [
      { value: "low", costMicros: 6000 },
      { value: "medium", costMicros: 50000 },
      { value: "high", costMicros: 210000 },
    ],
  },
  "gpt-image-1": {
    resolutions: [
      { value: "low", costMicros: 16000 },
      { value: "medium", costMicros: 63000 },
      { value: "high", costMicros: 250000 },
    ],
  },
  "gpt-image-1-mini": {
    resolutions: [
      { value: "low", costMicros: 6000 },
      { value: "medium", costMicros: 15000 },
      { value: "high", costMicros: 52000 },
    ],
  },
};

/** The resolution a model uses when none is chosen. */
export function defaultResolution(model: ModelConfig): string | undefined {
  return model.kind === "video"
    ? model.defaults.resolution
    : model.defaults.imageSize;
}

/** Checks a choice against the model's options and prices it. Returns null when the choice is not offered. */
export function quote(
  model: ModelConfig,
  sel: Selection = {},
  at: Date = new Date(),
) {
  const opts = OPTIONS[model.key];
  if (!opts) {
    if (
      (sel.resolution && sel.resolution !== defaultResolution(model)) ||
      (sel.seconds && sel.seconds !== model.defaults.seconds)
    )
      return null;
    return {
      costMicros: currentPrice(model, at).costMicros,
      resolution: defaultResolution(model),
      seconds: model.kind === "video" ? model.defaults.seconds : undefined,
    };
  }
  const resolution = sel.resolution ?? defaultResolution(model);
  const option = opts.resolutions.find((r) => r.value === resolution);
  if (!option) return null;
  if (model.kind === "image") {
    if (sel.seconds) return null;
    return {
      costMicros: option.costMicros,
      resolution: option.value,
      seconds: undefined,
    };
  }
  const seconds = sel.seconds ?? option.seconds ?? model.defaults.seconds ?? 8;
  if (opts.durations && !opts.durations.includes(seconds)) return null;
  if (option.seconds && option.seconds !== seconds) return null;
  return {
    costMicros: option.costMicros * seconds,
    resolution: option.value,
    seconds,
  };
}
