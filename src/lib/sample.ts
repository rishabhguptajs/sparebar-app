// Sample content for the dev-only /preview routes. Never used by the real app.
import { art } from "@/lib/art";
import { OPTIONS, defaultResolution } from "@/config/model-options";
import { MODEL_META, tierFor } from "@/config/model-meta";
import { MODELS } from "@/config/models";
import { refsFor } from "@/config/model-refs";
import { EMPTY_PROFILE } from "@/lib/prompts/profile";
import { creditsForModel } from "@/lib/credits";
import type { CharacterCard, ModelOption, PresentedJob, ProductCard } from "@/lib/ui-types";

export const sampleModels: ModelOption[] = MODELS.filter((m) => m.enabled)
  .map((m) => {
    const credits = creditsForModel(m);
    const meta = MODEL_META[m.key];
    return {
      key: m.key,
      label: m.label,
      kind: m.kind,
      credits,
      detail:
        m.kind === "video"
          ? `Around ${m.defaults.seconds ?? 8} seconds, ${m.defaults.resolution ?? "720p"}`
          : `${m.defaults.imageSize ?? "1K"} image`,
      ...meta,
    resolutions: OPTIONS[m.key]?.resolutions ?? [],
    durations: OPTIONS[m.key]?.durations ?? [],
    defaultResolution: defaultResolution(m) ?? null,
    defaultSeconds: m.kind === "video" ? (m.defaults.seconds ?? null) : null,
      tier: tierFor(m.kind, credits),
      available: 38,
      paused: false,
      maxRefs: refsFor(m).maxRefs,
    };
  })
  .sort((x, y) => x.rank - y.rank);

export const sampleProducts: ProductCard[] = [
  { id: "p1", name: "Glow vitamin C serum", pitch: "A lightweight serum that brightens skin in two weeks", photoUrl: art(21), labelUrl: art(22) },
  { id: "p2", name: "Daily water bottle", pitch: "", photoUrl: art(24), labelUrl: null },
];

export const sampleCharacters: CharacterCard[] = [
  {
    id: "c1",
    name: "Maya",
    niche: "Skincare",
    tone: "Warm and chatty",
    description:
      "Late twenties, shoulder length dark curls, warm brown skin, small gold hoops",
    coverUrl: art(3),
    profile: { ...EMPTY_PROFILE, gender: "woman", ageRange: "late 20s", skinTone: "brown", hairLength: "shoulder length", hairColor: "dark brown", hairStyle: "curly", features: "small gold hoops", wardrobe: "Neutral knitwear" },
    profileFilled: 6,
    photoCount: 3,
    angleTags: ["front", "angle", "full"],
    photoUrls: [art(3), art(4), art(5)],
    outfits: [{ id: "o1", name: "Brunch", description: "Linen shirt and high waisted jeans", photoUrl: null }],
  },
  {
    id: "c2",
    name: "Theo",
    niche: "Fitness",
    tone: "Direct and upbeat",
    description:
      "Early thirties, short sandy hair, light stubble, denim jacket",
    coverUrl: art(8),
    profile: EMPTY_PROFILE,
    profileFilled: 0,
    photoCount: 1,
    angleTags: ["photo"],
    photoUrls: [art(8)],
    outfits: [],
  },
  {
    id: "c3",
    name: "Ines",
    niche: "Fashion",
    tone: "Dry and funny",
    description: "Mid twenties, sleek black bob, round glasses, minimal makeup",
    coverUrl: art(13),
    profile: EMPTY_PROFILE,
    profileFilled: 0,
    photoCount: 1,
    angleTags: ["photo"],
    photoUrls: [art(13)],
    outfits: [],
  },
];

const mk = (
  i: number,
  kind: "image" | "video",
  ratio: string,
  prompt: string,
  status: PresentedJob["status"] = "succeeded",
  mins = i * 37,
): PresentedJob => ({
  id: `s${i}`,
  modelKey: kind === "image" ? "nano-banana-2.1" : "gemini-omni-flash",
  modelLabel: kind === "image" ? "Nano Banana 2.1" : "Gemini Omni Flash",
  kind,
  prompt,
  aspectRatio: ratio,
  characterId: "c1",
  status,
  credits: kind === "image" ? 2 : 27,
  error:
    status === "failed"
      ? "Generation failed. Your credits were refunded."
      : null,
  createdAt: new Date(Date.now() - mins * 60_000).toISOString(),
  completedAt: null,
  outputs:
    status === "succeeded"
      ? [
          {
            mime: "image/svg+xml",
            url: art(i * 5 + 1, ratio),
            thumbUrl: null,
            downloadUrl: "#",
          },
        ]
      : [],
});

export const sampleJobs: PresentedJob[] = [
  mk(
    1,
    "image",
    "9:16",
    "Unboxing a skincare set on a bright bathroom counter, handheld, natural light",
  ),
  mk(
    2,
    "video",
    "9:16",
    "Walking through a farmers market with a tote bag, laughing at something off camera",
  ),
  mk(
    3,
    "image",
    "1:1",
    "Flat lay of a morning routine, coffee, notebook and sunglasses",
  ),
  mk(
    4,
    "image",
    "4:5",
    "Mirror selfie in a small apartment hallway, soft evening light",
  ),
  mk(
    5,
    "video",
    "16:9",
    "Time lapse of a desk setup coming together, warm lamp, wide shot",
  ),
  mk(
    6,
    "image",
    "9:16",
    "Portrait by a window, linen shirt, quiet morning",
    "failed",
  ),
  mk(
    7,
    "image",
    "9:16",
    "Holding a ceramic mug up to the camera, cozy kitchen",
  ),
  mk(8, "video", "9:16", "Applying lip balm in a car mirror, golden hour"),
];

export const sampleResult: PresentedJob = {
  ...mk(99, "video", "9:16", ""),
  outputs: [{ mime: "image/svg+xml", url: art(21, "9:16"), thumbUrl: null, downloadUrl: "#" }],
};

/** Stand-in picture for the avatar preview. The real portraits are generated from the admin page. */
export const sampleAvatarArt = (i: number) => art(((i % 30) + 1));
