// What a person sees about each model when choosing: who made it, how good it is for the job,
// and what it can do. `rank` orders the picker within images or videos; the lowest ranks are the top picks.
// The tags come from OpenRouter's model lists (read 19 Oct 2026).

export type ModelMeta = {
  maker: string;
  rank: number;
  blurb: string;
  tags: string[];
  /** Set to true only after the consistency test set (scripts/consistency-eval.ts) shows this model keeps a face and a product the same. Left unset until then. */
  consistent?: boolean;
};

export const CONSISTENT_TAG = "Best for consistency";

/** Tags shown for a model, with the consistency tag added only when it has been earned. */
export const tagsOf = (meta?: ModelMeta) => (meta ? [...meta.tags, ...(meta.consistent ? [CONSISTENT_TAG] : [])] : []);

/** Ranks up to this are shown first as top picks. */
export const TOP_PICKS = 6;

export const MODEL_META: Record<string, ModelMeta> = {
  "seedance-2.0": {
    maker: "ByteDance",
    rank: 1,
    blurb: "Most realistic people and motion. Best all-round pick.",
    tags: ["Sound", "Up to 15s", "Up to 4K", "Photo to video"],
  },
  "kling-v3-std": {
    maker: "Kling",
    rank: 2,
    blurb: "Natural faces and smooth movement with sound.",
    tags: ["Sound", "Up to 15s", "Up to 720p", "Photo to video"],
  },
  "veo-3.1-fast": {
    maker: "Google",
    rank: 3,
    blurb: "Google video with speech, at a lower price.",
    tags: ["Sound", "Up to 8s", "Up to 4K", "Photo to video"],
  },
  "veo-3.1": {
    maker: "Google",
    rank: 4,
    blurb: "Google's best video, with clear speech and sound.",
    tags: ["Sound", "Up to 8s", "Up to 4K", "Photo to video"],
  },
  "seedance-2.0-fast": {
    maker: "ByteDance",
    rank: 5,
    blurb: "Seedance quality, faster and cheaper.",
    tags: ["Sound", "Up to 15s", "Up to 720p", "Photo to video"],
  },
  "kling-v3-pro": {
    maker: "Kling",
    rank: 6,
    blurb: "Kling at its sharpest, for final cuts.",
    tags: ["Sound", "Up to 15s", "Up to 720p", "Photo to video"],
  },
  "veo-3.1-lite": {
    maker: "Google",
    rank: 7,
    blurb: "Cheapest way to get Veo speech and sound.",
    tags: ["Sound", "Up to 8s", "Up to 1080p", "Photo to video"],
  },
  "grok-imagine-video-1.5-lite": {
    maker: "xAI",
    rank: 8,
    blurb: "Fast, cheap drafts to try an idea.",
    tags: ["Up to 15s", "Up to 1080p", "Photo to video"],
  },
  "wan-3.0": {
    maker: "Alibaba",
    rank: 9,
    blurb: "Solid quality, clips up to 30 seconds.",
    tags: ["Sound", "Up to 30s", "Up to 1080p", "Photo to video"],
  },
  "seedance-2.5": {
    maker: "ByteDance",
    rank: 10,
    blurb: "Newest Seedance, clips up to 30 seconds.",
    tags: ["Sound", "Up to 30s", "Up to 720p", "Photo to video"],
  },
  "seedance-2.0-mini": {
    maker: "ByteDance",
    rank: 11,
    blurb: "Low cost Seedance for testing scenes.",
    tags: ["Sound", "Up to 15s", "Up to 720p", "Photo to video"],
  },
  "seedance-1.5-pro": {
    maker: "ByteDance",
    rank: 12,
    blurb: "Older Seedance, cheap with sound.",
    tags: ["Sound", "Up to 12s", "Up to 1080p", "Photo to video"],
  },
  "hailuo-3": {
    maker: "MiniMax",
    rank: 14,
    blurb: "High detail 2K video with sound.",
    tags: ["Sound", "Up to 15s", "Up to 2K", "Photo to video"],
  },
  "grok-imagine-video-1.5": {
    maker: "xAI",
    rank: 15,
    blurb: "Grok at higher quality.",
    tags: ["Up to 15s", "Up to 1080p", "Photo to video"],
  },
  "runway-gen-4.5": {
    maker: "Runway",
    rank: 16,
    blurb: "Cinematic camera moves. No sound.",
    tags: ["No sound", "Up to 10s", "Up to 720p", "Photo to video"],
  },
  "flux-3-video": {
    maker: "Black Forest Labs",
    rank: 17,
    blurb: "Sharp video from the FLUX team, up to 4K.",
    tags: ["Sound", "Up to 20s", "Up to 4K", "Photo to video"],
  },
  "wan-3.0-prime": {
    maker: "Alibaba",
    rank: 18,
    blurb: "Wan 3.0 with faster turnaround.",
    tags: ["Sound", "Up to 30s", "Up to 1080p", "Photo to video"],
  },
  "happyhorse-1.1": {
    maker: "Alibaba",
    rank: 19,
    blurb: "Steady motion at a mid price.",
    tags: ["Up to 15s", "Up to 1080p", "Photo to video"],
  },
  "hailuo-3-max": {
    maker: "MiniMax",
    rank: 20,
    blurb: "Cheaper Hailuo at 768p. No sound.",
    tags: ["No sound", "Up to 15s", "Up to 768p", "Photo to video"],
  },
  "grok-imagine-video": {
    maker: "xAI",
    rank: 21,
    blurb: "Original Grok video, low price.",
    tags: ["Up to 15s", "Up to 720p", "Photo to video"],
  },
  "heygen-video": {
    maker: "HeyGen",
    rank: 22,
    blurb: "Short clips with built-in dialogue.",
    tags: ["No sound", "Up to 15s", "Up to 2K", "Photo to video"],
  },
  "wan-2.7": {
    maker: "Alibaba",
    rank: 23,
    blurb: "Previous Wan, 2 to 10 seconds.",
    tags: ["Sound", "Up to 10s", "Up to 1080p", "Photo to video"],
  },
  "kling-video-o1": {
    maker: "Kling",
    rank: 24,
    blurb: "Kling O1, 5 or 10 second clips.",
    tags: ["Sound", "Up to 10s", "Up to 720p", "Photo to video"],
  },
  "happyhorse-1.0": {
    maker: "Alibaba",
    rank: 25,
    blurb: "Earlier HappyHorse.",
    tags: ["Up to 15s", "Up to 1080p", "Photo to video"],
  },
  "wan-2.6": {
    maker: "Alibaba",
    rank: 26,
    blurb: "Older Wan, 5 or 10 second clips.",
    tags: ["Sound", "Up to 10s", "Up to 1080p", "Photo to video"],
  },
  "heygen-avatar-iv": {
    maker: "HeyGen",
    rank: 27,
    blurb: "Talking head from one photo. Coming soon.",
    tags: ["Talking head", "Needs a script"],
  },
  "nano-banana-2.1": {
    maker: "Google",
    rank: 1,
    blurb: "Newest Gemini image model. Fast and sharp. Free credits work here.",
    tags: ["Photo reference", "Up to 4K"],
  },
  "nano-banana-pro": {
    maker: "Google",
    rank: 2,
    blurb: "Gemini's best. Great with text and faces.",
    tags: ["Photo reference", "Up to 4K"],
  },
  "nano-banana-2": {
    maker: "Google",
    rank: 3,
    blurb: "Gemini image quality at half the price of Pro.",
    tags: ["Photo reference", "Up to 4K"],
  },
  "seedream-5-pro": {
    maker: "ByteDance",
    rank: 4,
    blurb: "Detailed, true to life images.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "flux-3-image": {
    maker: "Black Forest Labs",
    rank: 5,
    blurb: "Photoreal look with clean skin and light.",
    tags: ["Photo reference", "Up to 4K"],
  },
  "grok-imagine-image": {
    maker: "xAI",
    rank: 6,
    blurb: "Bold, punchy images.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "qwen-image-3": {
    maker: "Alibaba",
    rank: 7,
    blurb: "Good with text on signs and labels.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "nano-banana": {
    maker: "Google",
    rank: 8,
    blurb: "The original. Cheap and quick.",
    tags: ["Photo reference"],
  },
  "nano-banana-2-lite": {
    maker: "Google",
    rank: 9,
    blurb: "Lowest cost Gemini 3 image.",
    tags: ["Photo reference", "Up to 1K"],
  },
  "seedream-5-lite": {
    maker: "ByteDance",
    rank: 10,
    blurb: "Seedream at a lower price.",
    tags: ["Photo reference", "Up to 4K"],
  },
  "seedream-5-flash": {
    maker: "ByteDance",
    rank: 11,
    blurb: "Very cheap and quick drafts.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "flux-2-pro": {
    maker: "Black Forest Labs",
    rank: 12,
    blurb: "Reliable FLUX photos.",
    tags: ["Photo reference"],
  },
  "recraft-v4.1": {
    maker: "Recraft",
    rank: 13,
    blurb: "Clean, designed looking images.",
    tags: ["Photo reference"],
  },
  "qwen-image-3-pro": {
    maker: "Alibaba",
    rank: 14,
    blurb: "Qwen with extra detail.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "riverflow-v2.5-pro": {
    maker: "Sourceful",
    rank: 15,
    blurb: "Strong edits and product shots.",
    tags: ["Photo reference", "Up to 4K"],
  },
  "recraft-v4.1-pro": {
    maker: "Recraft",
    rank: 16,
    blurb: "Recraft at top quality.",
    tags: ["Photo reference"],
  },
  "flux-3-image-klein": {
    maker: "Black Forest Labs",
    rank: 17,
    blurb: "The cheapest FLUX. Great for drafts.",
    tags: ["Photo reference", "Up to 4K"],
  },
  "grok-imagine-image-2": {
    maker: "xAI",
    rank: 18,
    blurb: "Newer Grok image model.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "seedream-4.5": {
    maker: "ByteDance",
    rank: 19,
    blurb: "Earlier Seedream.",
    tags: ["Photo reference", "Up to 4K"],
  },
  "flux-2-max": {
    maker: "Black Forest Labs",
    rank: 20,
    blurb: "Top quality FLUX.2.",
    tags: ["Photo reference"],
  },
  "qwen-image-2.1-pro": {
    maker: "Alibaba",
    rank: 21,
    blurb: "Earlier Qwen, detailed.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "riverflow-v2.5-fast": {
    maker: "Sourceful",
    rank: 22,
    blurb: "Quick and cheap edits.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "qwen-image-2.1-turbo": {
    maker: "Alibaba",
    rank: 23,
    blurb: "Fast, low cost Qwen.",
    tags: ["Photo reference", "Up to 2K"],
  },
  "recraft-v4.1-flash": {
    maker: "Recraft",
    rank: 24,
    blurb: "Lowest price images.",
    tags: [],
  },
  "recraft-v4-pro": {
    maker: "Recraft",
    rank: 25,
    blurb: "Earlier Recraft Pro.",
    tags: ["Photo reference"],
  },
  "gpt-image-2": {
    maker: "OpenAI",
    rank: 26,
    blurb: "ChatGPT's image model. Follows long prompts and writes clean text.",
    tags: ["Photo reference"],
  },
  "gpt-image-2.5-sunburst": {
    maker: "OpenAI",
    rank: 27,
    blurb: "Newer ChatGPT image model, same price as GPT Image 2.",
    tags: ["Photo reference"],
  },
  "gpt-image-2.5-flare": {
    maker: "OpenAI",
    rank: 28,
    blurb: "Newer ChatGPT image model, same price as GPT Image 2.",
    tags: ["Photo reference"],
  },
  "gpt-image-1": {
    maker: "OpenAI",
    rank: 29,
    blurb: "The first ChatGPT image model.",
    tags: ["Photo reference"],
  },
  "gpt-image-1-mini": {
    maker: "OpenAI",
    rank: 30,
    blurb: "Cheap ChatGPT images for drafts.",
    tags: ["Photo reference"],
  },
};

export type Tier = "budget" | "standard" | "premium";

/** Price bands by credits per generation, so the picker can filter by what a person wants to spend. */
export function tierFor(kind: "image" | "video", credits: number): Tier {
  const [low, mid] = kind === "video" ? [15, 45] : [2, 5];
  return credits <= low ? "budget" : credits <= mid ? "standard" : "premium";
}
