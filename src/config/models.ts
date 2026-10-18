// Model catalog. A model is a config entry: swapping a lab or a price is an edit here, not in code.
// All money is integer micro-USD (1 USD = 1_000_000) to avoid float rounding at the credit boundary.

export type Lab = "openrouter" | "google" | "xai" | "minimax" | "alibaba";
export type Kind = "image" | "video";

export type Price = {
  /** ISO date (UTC) from which this price applies. Add a new row for announced changes. */
  effectiveFrom: string;
  /** Estimated lab cost of one generation at the default settings. */
  costMicros: number;
  /**
   * Token rates, for labs that bill per output token. Used to compute the
   * actual cost from the usage the lab reports. Micro-USD per 1M tokens.
   */
  perMillionOutputTokens?: Partial<
    Record<"text" | "image" | "video" | "audio", number>
  >;
  /** Per second of output video, for labs that report the seconds they billed. Micro-USD. */
  perSecondMicros?: number;
};

export type ModelConfig = {
  key: string;
  label: string;
  lab: Lab;
  /** Exact model id the lab's API expects. */
  apiModel: string;
  kind: Kind;
  /** Settings the estimate assumes (resolution, seconds). Passed to the adapter. */
  defaults: {
    resolution?: string;
    imageSize?: string;
    seconds?: number;
    aspectRatio?: string;
  };
  prices: Price[];
  /** Only enabled models are offered. A model also needs an adapter for its lab. */
  enabled: boolean;
  /** Free credits may only be spent on models where this is true. */
  freeEligible: boolean;
};

const usd = (n: number) => Math.round(n * 1_000_000);

export const MODELS: ModelConfig[] = [
  {
    key: "nano-banana-2.1",
    label: "Nano Banana 2.1",
    lab: "openrouter",
    apiModel: "google/gemini-nano-banana-2.1",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.0336) }],
    enabled: true,
    freeEligible: true,
  },
  {
    key: "nano-banana-pro",
    label: "Nano Banana Pro",
    lab: "openrouter",
    apiModel: "google/gemini-3-pro-image",
    kind: "image",
    defaults: { imageSize: "2K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.134) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "nano-banana-2",
    label: "Nano Banana 2",
    lab: "openrouter",
    apiModel: "google/gemini-3.1-flash-image",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.067) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "nano-banana",
    label: "Nano Banana",
    lab: "openrouter",
    apiModel: "google/gemini-2.5-flash-image",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.039) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "nano-banana-2-lite",
    label: "Nano Banana 2 Lite",
    lab: "openrouter",
    apiModel: "google/gemini-3.1-flash-lite-image",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.045) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "grok-imagine-image",
    label: "Grok Imagine Image",
    lab: "openrouter",
    apiModel: "x-ai/grok-imagine-image-quality",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.05) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "seedream-5-pro",
    label: "Seedream 5 Pro",
    lab: "openrouter",
    apiModel: "bytedance-seed/seedream-5-0-pro",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.045) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "flux-3-image",
    label: "FLUX 3",
    lab: "openrouter",
    apiModel: "black-forest-labs/flux-3-image",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.048) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "qwen-image-3",
    label: "Qwen Image 3",
    lab: "openrouter",
    apiModel: "qwen/qwen-image-3",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.03) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "gemini-omni-flash",
    label: "Gemini Omni Flash",
    lab: "google", // Not on OpenRouter, so this one still calls Google directly (GEMINI_API_KEY).
    apiModel: "gemini-omni-1.1-flash",
    kind: "video",
    // Omni has no duration field; length follows the prompt. Google quotes about $0.10 per second at 720p.
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [
      {
        effectiveFrom: "2026-01-01",
        costMicros: usd(0.1) * 8,
        perMillionOutputTokens: { video: usd(17.5), text: usd(9) },
      },
    ],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "veo-3.1",
    label: "Veo 3.1",
    lab: "openrouter",
    apiModel: "google/veo-3.1",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.4) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "veo-3.1-fast",
    label: "Veo 3.1 Fast",
    lab: "openrouter",
    apiModel: "google/veo-3.1-fast",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.1) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "veo-3.1-lite",
    label: "Veo 3.1 Lite",
    lab: "openrouter",
    apiModel: "google/veo-3.1-lite",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.05) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "seedance-2.0",
    label: "Seedance 2.0",
    lab: "openrouter",
    apiModel: "bytedance/seedance-2.0",
    // Billed per video token; this is an estimate for 8s at 720p. The real cost is read from the job.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [
      {
        effectiveFrom: "2026-01-01",
        costMicros: Math.round(172_800 * 7e-6 * 1_000_000),
      },
    ],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "seedance-2.0-fast",
    label: "Seedance 2.0 Fast",
    lab: "openrouter",
    apiModel: "bytedance/seedance-2.0-fast",
    // Same token estimate as Seedance 2.0.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [
      {
        effectiveFrom: "2026-01-01",
        costMicros: Math.round(172_800 * 4.2e-6 * 1_000_000),
      },
    ],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "seedance-2.0-mini",
    label: "Seedance 2.0 Mini",
    lab: "openrouter",
    apiModel: "bytedance/seedance-2.0-mini",
    // Same token estimate as Seedance 2.0.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [
      {
        effectiveFrom: "2026-01-01",
        costMicros: Math.round(172_800 * 3.5e-6 * 1_000_000),
      },
    ],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "seedance-2.5",
    label: "Seedance 2.5",
    lab: "openrouter",
    apiModel: "bytedance/seedance-2.5",
    // Same token estimate as Seedance 2.0.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [
      {
        effectiveFrom: "2026-01-01",
        costMicros: Math.round(172_800 * 1.07e-5 * 1_000_000),
      },
    ],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "seedance-1.5-pro",
    label: "Seedance 1.5 Pro",
    lab: "openrouter",
    apiModel: "bytedance/seedance-1-5-pro",
    // Same token estimate as Seedance 2.0. With audio.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [
      {
        effectiveFrom: "2026-01-01",
        costMicros: Math.round(172_800 * 2.4e-6 * 1_000_000),
      },
    ],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "kling-v3-std",
    label: "Kling 3 Standard",
    lab: "openrouter",
    apiModel: "kwaivgi/kling-v3.0-std",
    // Price with audio.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.126) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "kling-v3-pro",
    label: "Kling 3 Pro",
    lab: "openrouter",
    apiModel: "kwaivgi/kling-v3.0-pro",
    // Price with audio.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.168) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "wan-3.0",
    label: "Wan 3.0",
    lab: "openrouter",
    apiModel: "alibaba/wan-3.0",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.1) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "wan-3.0-prime",
    label: "Wan 3.0 Prime",
    lab: "openrouter",
    apiModel: "alibaba/wan-3.0-prime",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.14) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "happyhorse-1.1",
    label: "HappyHorse 1.1",
    lab: "openrouter",
    apiModel: "alibaba/happyhorse-1.1",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.0988) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "grok-imagine-video-1.5-lite",
    label: "Grok Imagine Video 1.5 Lite",
    lab: "openrouter",
    apiModel: "x-ai/grok-imagine-video-1.5-lite",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.03) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "grok-imagine-video",
    label: "Grok Imagine Video",
    lab: "openrouter",
    apiModel: "x-ai/grok-imagine-video",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.07) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "grok-imagine-video-1.5",
    label: "Grok Imagine Video 1.5",
    lab: "openrouter",
    apiModel: "x-ai/grok-imagine-video-1.5",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.14) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "hailuo-3",
    label: "Hailuo 3",
    lab: "openrouter",
    apiModel: "minimax/hailuo-3",
    kind: "video",
    defaults: { resolution: "2K", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.13) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "hailuo-3-max",
    label: "Hailuo 3 Max",
    lab: "openrouter",
    apiModel: "minimax/hailuo-3-max",
    kind: "video",
    defaults: { resolution: "768p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.08) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "runway-gen-4.5",
    label: "Runway Gen-4.5",
    lab: "openrouter",
    apiModel: "runway/gen-4.5",
    // No sound.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.12) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "flux-3-video",
    label: "FLUX 3 Video",
    lab: "openrouter",
    apiModel: "black-forest-labs/flux-3-video",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.17) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "heygen-video",
    label: "HeyGen Video",
    lab: "openrouter",
    apiModel: "heygen/heygen-video-1",
    kind: "video",
    defaults: { resolution: "768p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.036) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "heygen-avatar-iv",
    label: "HeyGen Avatar IV",
    lab: "openrouter",
    apiModel: "heygen/avatar-iv",
    // Talking head from one photo. Needs a script and a voice, so it stays off until the voice step is built.
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.05) * 8 }],
    enabled: false,
    freeEligible: false,
  },
  {
    key: "seedream-5-lite",
    label: "Seedream 5 Lite",
    lab: "openrouter",
    apiModel: "bytedance-seed/seedream-5-0-lite",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.035) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "seedream-5-flash",
    label: "Seedream 5 Flash",
    lab: "openrouter",
    apiModel: "bytedance-seed/seedream-5-0-flash",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.018) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "seedream-4.5",
    label: "Seedream 4.5",
    lab: "openrouter",
    apiModel: "bytedance-seed/seedream-4.5",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.04) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "flux-3-image-klein",
    label: "FLUX 3 Klein",
    lab: "openrouter",
    apiModel: "black-forest-labs/flux-3-image-klein",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.009) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "flux-2-pro",
    label: "FLUX.2 Pro",
    lab: "openrouter",
    apiModel: "black-forest-labs/flux.2-pro",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.055) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "flux-2-max",
    label: "FLUX.2 Max",
    lab: "openrouter",
    apiModel: "black-forest-labs/flux.2-max",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.126) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "qwen-image-3-pro",
    label: "Qwen Image 3 Pro",
    lab: "openrouter",
    apiModel: "qwen/qwen-image-3-pro",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.04) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "qwen-image-2.1-pro",
    label: "Qwen Image 2.1 Pro",
    lab: "openrouter",
    apiModel: "qwen/qwen-image-2.1-pro",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.046) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "qwen-image-2.1-turbo",
    label: "Qwen Image 2.1 Turbo",
    lab: "openrouter",
    apiModel: "qwen/qwen-image-2.1-turbo",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.0184) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "grok-imagine-image-2",
    label: "Grok Imagine Image 2.0",
    lab: "openrouter",
    apiModel: "x-ai/grok-imagine-image-2.0",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.06) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "recraft-v4.1",
    label: "Recraft V4.1",
    lab: "openrouter",
    apiModel: "recraft/recraft-v4.1",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.035) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "recraft-v4.1-pro",
    label: "Recraft V4.1 Pro",
    lab: "openrouter",
    apiModel: "recraft/recraft-v4.1-pro",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.21) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "recraft-v4.1-flash",
    label: "Recraft V4.1 Flash",
    lab: "openrouter",
    apiModel: "recraft/recraft-v4.1-flash",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.007) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "recraft-v4-pro",
    label: "Recraft V4 Pro",
    lab: "openrouter",
    apiModel: "recraft/recraft-v4-pro",
    kind: "image",
    defaults: { aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.25) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "riverflow-v2.5-pro",
    label: "Riverflow 2.5 Pro",
    lab: "openrouter",
    apiModel: "sourceful/riverflow-v2.5-pro",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.13) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "riverflow-v2.5-fast",
    label: "Riverflow 2.5 Fast",
    lab: "openrouter",
    apiModel: "sourceful/riverflow-v2.5-fast",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.019) }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "wan-2.7",
    label: "Wan 2.7",
    lab: "openrouter",
    apiModel: "alibaba/wan-2.7",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.1) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "wan-2.6",
    label: "Wan 2.6",
    lab: "openrouter",
    apiModel: "alibaba/wan-2.6",
    // This model only makes 5 or 10 second clips.
    kind: "video",
    defaults: { resolution: "720p", seconds: 5, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.1) * 5 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "happyhorse-1.0",
    label: "HappyHorse 1.0",
    lab: "openrouter",
    apiModel: "alibaba/happyhorse-1.0",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.0988) * 8 }],
    enabled: true,
    freeEligible: false,
  },
  {
    key: "kling-video-o1",
    label: "Kling Video O1",
    lab: "openrouter",
    apiModel: "kwaivgi/kling-video-o1",
    // This model only makes 5 or 10 second clips.
    kind: "video",
    defaults: { resolution: "720p", seconds: 5, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.112) * 5 }],
    enabled: true,
    freeEligible: false,
  },
];

export function getModel(key: string): ModelConfig | undefined {
  return MODELS.find((m) => m.key === key);
}

/** The price row in force at `at`: the latest one whose effectiveFrom has passed. */
export function currentPrice(model: ModelConfig, at: Date = new Date()): Price {
  const live = model.prices
    .filter((p) => Date.parse(p.effectiveFrom) <= at.getTime())
    .sort((a, b) => Date.parse(b.effectiveFrom) - Date.parse(a.effectiveFrom));
  if (!live[0]) throw new Error(`No price in force for ${model.key}`);
  return live[0];
}
