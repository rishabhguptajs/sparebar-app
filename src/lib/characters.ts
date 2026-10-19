import "server-only";
import { getModel } from "@/config/models";
import { refsFor } from "@/config/model-refs";
import { extFor, getObjectBytes, putObject, signedUrl } from "@/lib/r2";
import { buildCharacterPrompt, type PromptCharacter } from "@/lib/prompts/build";
import { profileCompleteness, readProfile } from "@/lib/prompts/profile";
import { planRefs, type Framing } from "@/lib/prompts/refs";
import type { ReferenceImage } from "@/lib/providers";
import type { CharacterCard, OutfitCard } from "@/lib/ui-types";

export type CharacterRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  reference_keys: string[];
  reference_tags?: string[];
  profile?: unknown;
  niche?: string;
  tone?: string;
  created_at: string;
};

export type OutfitRow = { id: string; character_id: string; name: string; description: string; photo_key: string | null };

export async function presentOutfit(o: OutfitRow): Promise<OutfitCard> {
  return { id: o.id, name: o.name, description: o.description, photoUrl: o.photo_key ? await signedUrl(o.photo_key) : null };
}

export async function presentCharacter(row: CharacterRow, outfits: OutfitRow[] = []): Promise<CharacterCard> {
  const cover = row.reference_keys[0];
  const profile = readProfile(row.profile);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    niche: row.niche ?? "",
    tone: row.tone ?? "",
    coverUrl: cover ? await signedUrl(cover) : null,
    profile,
    profileFilled: profileCompleteness(profile).filled,
    photoCount: row.reference_keys.length,
    angleTags: row.reference_tags ?? [],
    photoUrls: await Promise.all(row.reference_keys.map((k) => signedUrl(k))),
    outfits: await Promise.all(outfits.filter((o) => o.character_id === row.id).map(presentOutfit)),
  };
}

export function promptCharacter(row: CharacterRow): PromptCharacter {
  return { name: row.name, description: row.description, profile: readProfile(row.profile) };
}

export type LoadedReferences = {
  images: ReferenceImage[];
  /** R2 keys of what was sent, in order. Saved on the job so a result can be traced. */
  keys: string[];
  use: { character: number; outfit: boolean; product: number };
};

async function toImage(key: string): Promise<ReferenceImage> {
  const f = await getObjectBytes(key);
  return { mime: f.mime, base64: Buffer.from(f.bytes).toString("base64") };
}

/**
 * The reference photos for one generation, in the order the prompt describes them:
 * the person, then the outfit, then the product last.
 */
export async function loadReferences(opts: {
  character?: CharacterRow;
  modelKey: string;
  framing?: Framing;
  outfitKey?: string | null;
  productKeys?: string[];
}): Promise<LoadedReferences> {
  const model = getModel(opts.modelKey);
  const { maxRefs } = model ? refsFor(model) : { maxRefs: 1 };
  const row = opts.character;
  const productKeys = opts.productKeys ?? [];
  const plan = planRefs({
    tags: row?.reference_tags?.length === row?.reference_keys.length ? (row?.reference_tags ?? []) : (row?.reference_keys ?? []).map(() => "photo"),
    framing: opts.framing ?? "half",
    maxRefs,
    outfit: !!opts.outfitKey,
    productPhotos: productKeys.length,
    hasCharacter: !!row,
  });
  const keys = [
    ...plan.character.map((i) => row!.reference_keys[i]),
    ...(plan.outfit && opts.outfitKey ? [opts.outfitKey] : []),
    ...productKeys.slice(0, plan.product),
  ];
  const images = await Promise.all(keys.map(toImage));
  return { images, keys, use: { character: plan.character.length, outfit: plan.outfit, product: plan.product } };
}

/** Text sent to the lab for a character generation. See src/lib/prompts. */
export function characterPrompt(
  row: CharacterRow,
  input: { scene: string; modelKey: string; outfit?: string; use: LoadedReferences["use"]; product?: { name?: string; pitch?: string } },
) {
  const model = getModel(input.modelKey);
  return buildCharacterPrompt({
    character: promptCharacter(row),
    scene: input.scene,
    mode: model ? refsFor(model).mode : "multi",
    outfit: input.outfit,
    product: input.product,
    refs: input.use,
  });
}

/** Most reference photos one character can hold: up to 3 uploads plus generated angles. */
export const MAX_CHARACTER_REFS = 6;

/** Copy a finished image job's output into the character's own folder, so deleting the job later cannot break it. */
export async function adoptOutput(userId: string, characterId: string, tag: string, source: { key: string }) {
  const f = await getObjectBytes(source.key);
  const key = `u/${userId}/characters/${characterId}/${tag}-${Date.now().toString(36)}.${extFor(f.mime)}`;
  await putObject(key, f.bytes, f.mime);
  return key;
}
