import "server-only";
import { randomUUID } from "node:crypto";
import { getModel } from "@/config/models";
import { AVATARS, type AvatarDef } from "@/config/avatars";
import { adoptOutput, presentCharacter, type CharacterRow } from "@/lib/characters";
import { buildAvatarPrompt, type AvatarShot } from "@/lib/prompts/build";
import { readProfile } from "@/lib/prompts/profile";
import { getAdapter } from "@/lib/providers";
import { extFor, getObjectBytes, putObject, signedUrl } from "@/lib/r2";
import { admin } from "@/lib/supabase/admin";
import type { AvatarCard } from "@/lib/ui-types";

type AvatarRow = {
  id: string;
  slug: string;
  name: string;
  gender: string;
  niches: string[];
  tagline: string;
  description: string;
  look: string;
  tone: string;
  profile: unknown;
  reference_keys: string[];
  reference_tags: string[];
  brand_count: number;
  active: boolean;
  sort: number;
};

// GPT Image 2 gave the most natural, distinct faces in a side by side test (Ananya, 26 Oct 2026).
const PORTRAIT_MODEL = "gpt-image-2";

export async function presentAvatar(r: AvatarRow): Promise<AvatarCard> {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    gender: r.gender,
    niches: r.niches,
    tagline: r.tagline,
    description: r.description,
    tone: r.tone,
    ageRange: readProfile(r.profile).ageRange,
    coverUrl: r.reference_keys[0] ? await signedUrl(r.reference_keys[0]) : null,
    photoUrls: await Promise.all(r.reference_keys.map((k) => signedUrl(k))),
    brandCount: r.brand_count,
    active: r.active,
  };
}

/** The library brands pick from: reviewed avatars only. */
export async function listAvatars(): Promise<AvatarCard[]> {
  const { data } = await admin().from("avatars").select("*").eq("active", true).order("sort").order("name");
  return Promise.all(((data ?? []) as AvatarRow[]).map(presentAvatar));
}

/** Every avatar, reviewed or not, for the admin page. */
export async function listAllAvatars(): Promise<AvatarCard[]> {
  const { data } = await admin().from("avatars").select("*").order("sort").order("name");
  return Promise.all(((data ?? []) as AvatarRow[]).map(presentAvatar));
}

/** Copies an avatar into the brand's own characters. Picking the same avatar twice returns the first copy. */
export async function adoptAvatar(userId: string, avatarId: string): Promise<{ character: Awaited<ReturnType<typeof presentCharacter>>; already: boolean } | null> {
  const db = admin();
  const { data } = await db.from("avatars").select("*").eq("id", avatarId).eq("active", true).maybeSingle();
  const a = data as AvatarRow | null;
  if (!a || a.reference_keys.length === 0) return null;

  const { data: existing } = await db.from("characters").select("*").eq("user_id", userId).eq("avatar_id", a.id).is("deleted_at", null).maybeSingle();
  if (existing) return { character: await presentCharacter(existing as CharacterRow), already: true };

  const id = randomUUID();
  // Copied into the brand's own folder, so changing or retiring the avatar later never alters their character.
  const keys = await Promise.all(a.reference_keys.map((k, i) => adoptOutput(userId, id, a.reference_tags[i] ?? "photo", { key: k })));
  const { data: saved, error } = await db
    .from("characters")
    .insert({
      id,
      user_id: userId,
      name: a.name,
      description: a.description,
      niche: a.niches[0] ?? "",
      tone: a.tone,
      profile: readProfile(a.profile),
      reference_keys: keys,
      reference_tags: a.reference_tags,
      avatar_id: a.id,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  await db.rpc("bump_avatar_brands", { p_avatar: a.id } as never);
  return { character: await presentCharacter(saved as CharacterRow), already: false };
}

// Admin side: make the portraits for the roster in src/config/avatars.ts and review them before they go live.

export function avatarDef(slug: string): AvatarDef | undefined {
  return AVATARS.find((a) => a.slug === slug);
}

/** Creates the row for a roster entry on first use. Rows start inactive until someone has reviewed the portraits. */
export async function ensureAvatarRow(def: AvatarDef): Promise<AvatarRow> {
  const db = admin();
  const { data } = await db.from("avatars").select("*").eq("slug", def.slug).maybeSingle();
  if (data) return data as AvatarRow;
  const { data: made, error } = await db
    .from("avatars")
    .insert({
      slug: def.slug,
      name: def.name,
      gender: def.gender,
      niches: def.niches,
      tagline: def.tagline,
      description: def.description,
      look: def.look,
      tone: def.tone,
      profile: def.profile,
      sort: AVATARS.indexOf(def),
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return made as AvatarRow;
}

async function render(def: AvatarDef, shot: AvatarShot, reference?: { mime: string; base64: string }) {
  const model = getModel(PORTRAIT_MODEL);
  const adapter = model && getAdapter(model.lab);
  if (!model || !adapter) throw new Error("Portrait model unavailable.");
  const p = buildAvatarPrompt({ name: def.name, description: def.description, look: def.look, profile: def.profile, niches: def.niches, shot, fromReference: !!reference });
  const result = await adapter.submit({ model, prompt: p.text, aspectRatio: "3:4", references: reference ? [reference] : undefined });
  if (result.status !== "succeeded" || result.outputs.length === 0) throw new Error(result.status === "failed" ? result.error : "The portrait did not finish.");
  return result.outputs[0];
}

async function store(slug: string, tag: string, file: { mime: string; bytes: Uint8Array }) {
  const key = `avatars/${slug}/${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.${extFor(file.mime)}`;
  await putObject(key, file.bytes, file.mime);
  return key;
}

/** Three separate front portraits to choose from. Each is a separate roll, so they will not be the same face. */
export async function makeCandidates(def: AvatarDef, count = 3) {
  const runs = await Promise.allSettled(Array.from({ length: count }, async () => store(def.slug, "cand", await render(def, "front"))));
  const keys = runs.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (keys.length === 0) throw new Error("No portrait could be generated.");
  return Promise.all(keys.map(async (key) => ({ key, url: await signedUrl(key) })));
}

/** Saves the chosen front portrait, then makes a three quarter and a full body shot of the same person from it. */
export async function chooseFront(def: AvatarDef, key: string) {
  if (!key.startsWith(`avatars/${def.slug}/cand-`)) throw new Error("That portrait does not belong to this avatar.");
  const row = await ensureAvatarRow(def);
  const f = await getObjectBytes(key);
  const reference = { mime: f.mime, base64: Buffer.from(f.bytes).toString("base64") };
  const keys = [await store(def.slug, "front", { mime: f.mime, bytes: f.bytes })];
  const tags = ["front"];
  for (const angle of ["angle", "full"] as const) {
    try {
      keys.push(await store(def.slug, angle, await render(def, angle, reference)));
      tags.push(angle);
    } catch (e) {
      console.error("avatar angle failed", def.slug, angle, e instanceof Error ? e.message : e);
    }
  }
  const { error } = await admin().from("avatars").update({ reference_keys: keys, reference_tags: tags, active: false } as never).eq("id", row.id);
  if (error) throw error;
  return { keys, tags };
}

export async function setAvatarActive(def: AvatarDef, active: boolean) {
  const row = await ensureAvatarRow(def);
  if (active && row.reference_keys.length === 0) throw new Error("Choose a portrait first.");
  const { error } = await admin().from("avatars").update({ active } as never).eq("id", row.id);
  if (error) throw error;
}
