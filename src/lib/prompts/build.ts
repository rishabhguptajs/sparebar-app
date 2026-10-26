// The one place prompt text for generations is written. Pure: no network, no database, so it can be tested.
// Studio, create flow, templates, portraits and the animate step all call into this file.
//
// Order of a character prompt: lead sentence (how to use the reference photos), identity, outfit, scene,
// reference guide, product, rules. A character that has no profile, outfit or extra references gets the exact
// text the app produced before this file existed (version p1), so older characters behave as they did.

import type { RefMode } from "@/config/model-refs";
import { hasProfile, type CharacterProfile } from "./profile";

/** p1: text before the prompt layer. p2: structured identity, outfit, reference guide and rules. */
export const PROMPT_VERSION = "p2";
export const LEGACY_PROMPT_VERSION = "p1";

export type PromptCharacter = { name: string; description: string; profile: CharacterProfile };

export type ReferenceUse = {
  /** Photos of the person. */
  character: number;
  /** An outfit photo is attached after the person. */
  outfit: boolean;
  /** Product photos are attached last. */
  product: number;
};

export type BuildInput = {
  character: PromptCharacter;
  scene: string;
  mode: RefMode;
  /** What they wear in this post. Falls back to the character's everyday style. */
  outfit?: string;
  product?: { name?: string; pitch?: string };
  refs: ReferenceUse;
};

const LEAD: Record<RefMode, string> = {
  multi: "Keep the same person as in the reference photos, with the same face, hair and build.",
  single: "Edit the reference photo into the scene below. Keep the same person, with the same face, hair and build.",
  first_frame: "The opening frame shows the person. Keep the same person for the whole clip, with the same face, hair and build.",
};

/** One line that states who the person is, from the profile. Empty when the profile is empty. */
export function identityLine(name: string, p: CharacterProfile): string {
  const hair = [p.hairLength, p.hairColor, p.hairStyle].filter(Boolean).join(" ");
  const parts = [
    p.gender,
    p.ageRange && `age ${p.ageRange}`,
    p.skinTone && `${p.skinTone} skin`,
    p.faceShape && `${p.faceShape} face`,
    p.eyes && `${p.eyes} eyes`,
    hair && `${hair} hair`,
    p.build && `${p.build} build`,
  ].filter(Boolean);
  if (parts.length === 0 && !p.features) return "";
  const base = parts.length ? `${name}, ${parts.join(", ")}.` : `${name}.`;
  return `Identity: ${base}${p.features ? ` Distinguishing features: ${p.features}.` : ""}`;
}

function referenceGuide(r: ReferenceUse): string | null {
  const kinds = [r.character > 0, r.outfit, r.product > 0].filter(Boolean).length;
  if (kinds < 2) return null;
  const parts: string[] = [];
  let at = 1;
  const range = (n: number, what: string) => {
    const s = n === 1 ? `Image ${at} shows ${what}` : `Images ${at} to ${at + n - 1} show ${what}`;
    at += n;
    return s;
  };
  if (r.character > 0) parts.push(range(r.character, "the person"));
  if (r.outfit) parts.push(range(1, "the outfit to wear"));
  if (r.product > 0) parts.push(range(r.product, "the product"));
  return `Reference images: ${parts.join("; ")}.`;
}

export function buildCharacterPrompt(input: BuildInput): { text: string; version: string } {
  const { character, scene, mode, product, refs } = input;
  const look = character.description.trim();
  const outfit = input.outfit?.trim() || "";
  const profile = character.profile;
  const structured = hasProfile(profile) || !!outfit || refs.outfit || refs.product > 1 || !!product?.name?.trim() || !!product?.pitch?.trim();

  if (!structured) {
    // Same text as before the prompt layer existed.
    const text = [LEAD[mode], look ? `Character details: ${look}` : null, `Scene: ${scene}`]
      .filter(Boolean)
      .join("\n");
    const withProduct =
      refs.product > 0 && mode === "multi"
        ? `${text}\nThe last reference image is the product. Show that exact product, unchanged, in the scene.`
        : text;
    return { text: withProduct, version: LEGACY_PROMPT_VERSION };
  }

  const wears = refs.outfit ? "the outfit shown in the outfit reference image." : outfit || profile.wardrobe;
  const lines = [
    LEAD[mode],
    identityLine(character.name, profile) || null,
    look ? `Character details: ${look}` : null,
    profile.vibe ? `Overall vibe: ${profile.vibe}.` : null,
    wears ? `Outfit: ${wears}` : null,
    `Scene: ${scene}`,
    referenceGuide(refs),
  ];
  if (refs.product > 0) {
    const named = product?.name?.trim();
    const pitch = product?.pitch?.trim();
    const about = [named && `Product: ${named}.`, pitch && (/[.!?]$/.test(pitch) ? pitch : `${pitch}.`)].filter(Boolean).join(" ");
    lines.push(
      about || null,
      refs.product > 1
        ? "The last reference images are the product, one from the front and one close up of the label. Show that exact product, unchanged, with the label readable."
        : "The last reference image is the product. Show that exact product, unchanged, in the scene.",
    );
  }
  lines.push(
    refs.product > 0
      ? "Do not change the face, add other people, or alter any text or logo on the product."
      : "Do not change the face or add other people.",
  );
  return { text: lines.filter(Boolean).join("\n"), version: PROMPT_VERSION };
}

export type PortraitAngle = "front" | "angle" | "full";

const ANGLE: Record<PortraitAngle, string> = {
  front: "Front facing, relaxed neutral expression, looking at the camera.",
  angle: "Three quarter view, soft natural smile.",
  full: "Full body, standing, simple casual outfit.",
};

/** Prompt for a portrait made from text alone, or an extra angle when a reference photo is attached. */
export function buildPortraitPrompt(input: {
  name: string;
  description: string;
  profile: CharacterProfile;
  angle?: PortraitAngle;
  /** The first reference photo shows the person, so keep them the same. */
  fromReference?: boolean;
}): { text: string; version: string } {
  const { name, description, profile, angle = "front", fromReference } = input;
  const look = description.trim();
  if (!hasProfile(profile) && angle === "front" && !fromReference) {
    return {
      text: `Portrait photo for a character reference. ${look}. Face clearly visible, natural light, plain background, shot on a phone camera.`,
      version: LEGACY_PROMPT_VERSION,
    };
  }
  const lines = [
    fromReference ? LEAD.multi : null,
    "Portrait photo for a character reference.",
    identityLine(name, profile) || null,
    look ? `Character details: ${look}` : null,
    ANGLE[angle],
    "Face clearly visible, natural light, plain background, shot on a phone camera.",
  ];
  return { text: lines.filter(Boolean).join("\n"), version: PROMPT_VERSION };
}

/** Prompt that animates an approved still into a clip. The still is sent as the opening frame. */
export function buildAnimatePrompt(input: { name: string; motion: string; line?: string; hasProduct?: boolean }): { text: string; version: string } {
  const motion = input.motion.trim();
  const line = input.line?.trim();
  const lines = [
    "The opening frame is the approved still. Keep the same person, outfit, product and setting as in the frame for the whole clip.",
    motion ? `Motion: ${motion}` : "Motion: natural small movements, handheld phone footage.",
    line ? `${input.name} says: "${line}"` : null,
    input.hasProduct ? "Keep the product shape and label exactly as in the frame." : null,
    "Do not change the face or add other people.",
  ];
  return { text: lines.filter(Boolean).join("\n"), version: PROMPT_VERSION };
}

/** Prompt for a product shot with no character: the scene plus the rule that the product stays as it is. */
export function buildProductPrompt(input: { scene: string; photos: number; product?: { name?: string; pitch?: string } }): { text: string; version: string } {
  const { scene, photos, product } = input;
  if (photos === 0) return { text: scene, version: LEGACY_PROMPT_VERSION };
  const named = product?.name?.trim();
  const pitch = product?.pitch?.trim();
  if (!named && !pitch && photos === 1) {
    return { text: `${scene}\nThe last reference image is the product. Show that exact product, unchanged, in the scene.`, version: LEGACY_PROMPT_VERSION };
  }
  const about = [named && `Product: ${named}.`, pitch && (/[.!?]$/.test(pitch) ? pitch : `${pitch}.`)].filter(Boolean).join(" ");
  const lines = [
    `Scene: ${scene}`,
    about || null,
    photos > 1
      ? "The reference images are the product, one from the front and one close up of the label. Show that exact product, unchanged, with the label readable."
      : "The reference image is the product. Show that exact product, unchanged, in the scene.",
    "Do not alter any text or logo on the product.",
  ];
  return { text: lines.filter(Boolean).join("\n"), version: PROMPT_VERSION };
}

export type AvatarShot = "front" | "angle" | "full";

const AVATAR_SHOT: Record<AvatarShot, string> = {
  front: "A candid front camera selfie, arm held out, taken on a phone. Head, shoulders and upper body, a little wide angle. Looking at the lens with a relaxed, natural half smile, not posed.",
  angle: "A candid photo taken by a friend, three quarter view, the face turned slightly away and a soft natural smile. Waist up, a little off centre, caught between moments.",
  full: "A full length photo taken by a friend from a few steps away. Head to toe, standing in a relaxed everyday pose, shoes visible, mid movement rather than stiff.",
};

/**
 * Reference photos for a premade avatar. Unlike a character portrait these are made to look like real phone photos:
 * a lived in place, the avatar's own clothes and a natural expression. A neutral face against a plain wall reads as an
 * ID photo and makes every later ad look stiff. The three shots come from one imagined day, so the angle and full body
 * shots are made from the front shot with the same clothes and place.
 */
export function buildAvatarPrompt(input: {
  name: string;
  description: string;
  look: string;
  profile: CharacterProfile;
  niches: string[];
  shot: AvatarShot;
  /** The front shot is attached, so keep the same person, clothes and place. */
  fromReference?: boolean;
}): { text: string; version: string } {
  const { name, description, look, profile, niches, shot, fromReference } = input;
  const lines = [
    fromReference ? "The reference photo shows the person. Keep exactly the same person, with the same face, hair, build, clothes and place, and change only the framing as described." : null,
    AVATAR_SHOT[shot],
    identityLine(name, profile) || null,
    description.trim() ? `About their look: ${description.trim()}` : null,
    look.trim() ? `Photo details: ${look.trim()}` : null,
    profile.wardrobe ? `Wearing: one specific everyday outfit in this style: ${profile.wardrobe}.` : null,
    profile.vibe ? `Personality shows in the expression and posture: ${profile.vibe}.` : null,
    fromReference ? null : `Setting: a real, lived in place from their everyday life${niches.length ? ` (they make ${niches.join(" and ")} content)` : ""}, such as a balcony, a street, a room or a trail. Natural light, a believable messy background, not a studio.`,
    "Shot on a recent iPhone. True skin with visible pores and small imperfections, natural hair with flyaways, no retouching, no beauty filter, no airbrushed or plastic skin.",
    "No brand logos and no readable text on clothing or accessories. One person only.",
  ];
  return { text: lines.filter(Boolean).join("\n"), version: "a1" };
}
