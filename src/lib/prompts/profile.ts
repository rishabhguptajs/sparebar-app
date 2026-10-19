// The structured look of a character. Stored as one JSON object on the character row.
// Every field is optional: an old character with only a description still works.

import { z } from "zod";

export const PROFILE_OPTIONS = {
  ageRange: ["late teens", "early 20s", "mid 20s", "late 20s", "early 30s", "mid 30s", "late 30s", "40s", "50s", "60s or older"],
  gender: ["woman", "man", "non-binary person"],
  skinTone: ["very fair", "fair", "light", "medium", "olive", "tan", "brown", "dark brown", "deep"],
  faceShape: ["oval", "round", "square", "heart shaped", "long", "diamond"],
  eyes: ["dark brown", "brown", "hazel", "green", "blue", "grey"],
  hairColor: ["black", "dark brown", "brown", "light brown", "blonde", "red", "grey", "white"],
  hairLength: ["buzzed", "short", "chin length", "shoulder length", "long"],
  hairStyle: ["straight", "wavy", "curly", "coily", "braided", "in a bun"],
  build: ["slim", "athletic", "average", "curvy", "plus size", "muscular"],
} as const;

export type OptionField = keyof typeof PROFILE_OPTIONS;
export const OPTION_FIELDS = Object.keys(PROFILE_OPTIONS) as OptionField[];

export const PROFILE_LABELS: Record<OptionField, string> = {
  ageRange: "Age",
  gender: "Gender",
  skinTone: "Skin tone",
  faceShape: "Face shape",
  eyes: "Eyes",
  hairColor: "Hair colour",
  hairLength: "Hair length",
  hairStyle: "Hair style",
  build: "Build",
};

const option = (field: OptionField) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (PROFILE_OPTIONS[field] as readonly string[]).includes(v), "Choose one of the listed options.")
    .default("");

export const ProfileSchema = z.object({
  ageRange: option("ageRange"),
  gender: option("gender"),
  skinTone: option("skinTone"),
  faceShape: option("faceShape"),
  eyes: option("eyes"),
  hairColor: option("hairColor"),
  hairLength: option("hairLength"),
  hairStyle: option("hairStyle"),
  build: option("build"),
  /** Things that make the face recognisable: freckles, a mole, glasses, a gap in the teeth. */
  features: z.string().trim().max(120).default(""),
  /** Everyday clothing style, used when a post does not set an outfit. */
  wardrobe: z.string().trim().max(120).default(""),
  vibe: z.string().trim().max(80).default(""),
});

export type CharacterProfile = z.infer<typeof ProfileSchema>;

export const EMPTY_PROFILE: CharacterProfile = ProfileSchema.parse({});

/** Reads whatever is stored (null, partial, or from an older version) into a full profile. */
export function readProfile(raw: unknown): CharacterProfile {
  const parsed = ProfileSchema.safeParse(raw && typeof raw === "object" ? raw : {});
  return parsed.success ? parsed.data : EMPTY_PROFILE;
}

/** True when the user has filled in anything beyond the free text description. */
export function hasProfile(p: CharacterProfile): boolean {
  return Object.values(p).some((v) => v !== "");
}

/** How many of the option fields are filled, for a "complete your character" nudge. */
export function profileCompleteness(p: CharacterProfile) {
  const filled = OPTION_FIELDS.filter((f) => p[f] !== "").length;
  return { filled, total: OPTION_FIELDS.length };
}
