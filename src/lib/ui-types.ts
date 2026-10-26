import type { CharacterProfile } from "@/lib/prompts/profile";

export type { PresentedJob } from "@/lib/jobs/present";

export type ModelOption = {
  key: string;
  label: string;
  kind: "image" | "video";
  credits: number;
  detail: string;
  maker: string;
  /** Lower is better known or better quality; the picker lists by this. */
  rank: number;
  blurb: string;
  tags: string[];
  /** Resolutions on offer. costMicros is per second for video, per image otherwise. */
  resolutions: { value: string; costMicros: number; seconds?: number }[];
  /** Video lengths on offer. Empty when the model does not take a length. */
  durations: number[];
  defaultResolution: string | null;
  defaultSeconds: number | null;
  tier: "budget" | "standard" | "premium";
  /** Credits the user can spend on this model right now (free credits only count for eligible models). */
  available: number;
  /** The lab recently refused requests over billing, so this model is hidden for now. */
  paused: boolean;
  /** Reference photos the model can use at once: 1 for video and some image models. */
  maxRefs: number;
};

export type CharacterCard = {
  id: string;
  name: string;
  description: string;
  niche: string;
  tone: string;
  coverUrl: string | null;
  /** Structured look, see src/lib/prompts/profile.ts. */
  profile: CharacterProfile;
  /** How many of the look fields are filled in. */
  profileFilled: number;
  photoCount: number;
  /** Role of each reference photo: photo, front, angle or full. */
  angleTags: string[];
  /** Signed links to every reference photo, in order. */
  photoUrls: string[];
  outfits: OutfitCard[];
};

/** A premade avatar in the shared library. */
export type AvatarCard = {
  id: string;
  slug: string;
  name: string;
  gender: string;
  niches: string[];
  tagline: string;
  description: string;
  tone: string;
  ageRange: string;
  coverUrl: string | null;
  photoUrls: string[];
  /** How many brands picked this avatar. */
  brandCount: number;
  active: boolean;
};

export type OutfitCard ={ id: string; name: string; description: string; photoUrl: string | null };

export type ProductCard = {
  id: string;
  name: string;
  pitch: string;
  photoUrl: string | null;
  labelUrl: string | null;
};

export const RATIOS = ["9:16", "1:1", "4:5", "16:9"] as const;
export type Ratio = (typeof RATIOS)[number];

export function cssRatio(r: string | null | undefined) {
  const [w, h] = (r ?? "9:16").split(":").map(Number);
  return w && h ? `${w} / ${h}` : "9 / 16";
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
