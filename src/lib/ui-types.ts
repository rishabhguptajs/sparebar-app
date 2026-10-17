export type { PresentedJob } from "@/lib/jobs/present";

export type ModelOption = {
  key: string;
  label: string;
  kind: "image" | "video";
  credits: number;
  detail: string;
  /** Credits the user can spend on this model right now (free credits only count for eligible models). */
  available: number;
};

export type CharacterCard = {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
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
