// Model catalog. A model is a config entry: swapping a lab or a price is an edit here, not in code.
// All money is integer micro-USD (1 USD = 1_000_000) to avoid float rounding at the credit boundary.

export type Lab = "google" | "xai" | "minimax" | "alibaba";
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
  perMillionOutputTokens?: Partial<Record<"text" | "image" | "video" | "audio", number>>;
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
  defaults: { resolution?: string; imageSize?: string; seconds?: number; aspectRatio?: string };
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
    lab: "google",
    apiModel: "gemini-nano-banana-2.1",
    kind: "image",
    defaults: { imageSize: "1K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.0336) }],
    enabled: true,
    freeEligible: true,
  },
  {
    key: "grok-imagine-image",
    label: "Grok Imagine Image",
    lab: "xai",
    apiModel: "grok-imagine-image-quality",
    kind: "image",
    defaults: { imageSize: "1K" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.05) }],
    enabled: false,
    freeEligible: false,
  },
  {
    key: "nano-banana-pro",
    label: "Nano Banana Pro",
    lab: "google",
    apiModel: "gemini-3-pro-image",
    kind: "image",
    defaults: { imageSize: "2K", aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.134) }],
    enabled: false, // turn on once the Google adapter is tested live
    freeEligible: false,
  },
  {
    key: "grok-imagine-video-1.5-lite",
    label: "Grok Imagine Video 1.5 Lite",
    lab: "xai",
    apiModel: "grok-imagine-video-1.5-lite",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.03) * 8 }],
    enabled: false,
    freeEligible: false,
  },
  {
    key: "grok-imagine-video",
    label: "Grok Imagine Video",
    lab: "xai",
    apiModel: "grok-imagine-video",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.07) * 8 }],
    enabled: false,
    freeEligible: false,
  },
  {
    key: "minimax-h3",
    label: "MiniMax H3",
    lab: "minimax",
    apiModel: "MiniMax-H3",
    kind: "video",
    defaults: { resolution: "768P", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.08) * 8, perSecondMicros: usd(0.08) }],
    enabled: false,
    freeEligible: false,
  },
  {
    key: "gemini-omni-flash",
    label: "Gemini Omni Flash",
    lab: "google",
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
    key: "wan-3.0",
    label: "Wan 3.0",
    lab: "alibaba",
    apiModel: "wan3.0-video", // preview model; also wan3.0-video-prime (faster)
    kind: "video",
    defaults: { resolution: "720P", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.1) * 8, perSecondMicros: usd(0.1) }],
    enabled: false,
    freeEligible: false,
  },
  {
    key: "grok-imagine-video-1.5",
    label: "Grok Imagine Video 1.5",
    lab: "xai",
    apiModel: "grok-imagine-video-1.5",
    kind: "video",
    defaults: { resolution: "720p", seconds: 8, aspectRatio: "9:16" },
    prices: [{ effectiveFrom: "2026-01-01", costMicros: usd(0.14) * 8 }],
    enabled: false,
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
