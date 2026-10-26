import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adoptOutput, presentCharacter, type CharacterRow } from "@/lib/characters";
import { startJob, UserFacingError } from "@/lib/jobs/run";
import { buildPortraitPrompt } from "@/lib/prompts/build";
import { hasProfile, ProfileSchema } from "@/lib/prompts/profile";
import { extFor, putObject } from "@/lib/r2";
import { admin } from "@/lib/supabase/admin";
import { getCharacters, preferredPortraitModel } from "@/lib/data";
import { createClient, getUser } from "@/lib/supabase/server";

export const maxDuration = 60;

const MAX_FILES = 3;
// The browser shrinks photos before upload. A serverless request body is capped at about 4.5 MB in total.
const MAX_BYTES = 1.4 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const Fields = z.object({
  name: z.string().trim().min(1, "Give the character a name.").max(60),
  description: z.string().trim().max(1000),
  niche: z.string().trim().max(80).default(""),
  tone: z.string().trim().max(80).default(""),
});

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ characters: await getCharacters(await createClient()) });
}

// Creates a character from uploaded photos, from a portrait the user picked out of a set of candidates,
// or, with neither, from one generated portrait.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const fields = Fields.safeParse({ name: form.get("name") ?? "", description: form.get("description") ?? "", niche: form.get("niche") ?? "", tone: form.get("tone") ?? "" });
  if (!fields.success) return NextResponse.json({ error: fields.error.issues[0].message }, { status: 400 });
  let rawProfile: unknown = {};
  try {
    rawProfile = JSON.parse(String(form.get("profile") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const profile = ProfileSchema.safeParse(rawProfile);
  if (!profile.success) return NextResponse.json({ error: profile.error.issues[0].message }, { status: 400 });

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Add up to ${MAX_FILES} photos.` }, { status: 400 });
  for (const f of files) {
    if (!ALLOWED.has(f.type)) return NextResponse.json({ error: "Photos must be PNG, JPG or WebP." }, { status: 400 });
    if (f.size > MAX_BYTES) return NextResponse.json({ error: "That photo is too large. Try a smaller one." }, { status: 400 });
  }
  const pickedJob = String(form.get("pickedJobId") ?? "");
  if (pickedJob && !z.string().uuid().safeParse(pickedJob).success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (files.length === 0 && !pickedJob && fields.data.description.length < 10 && !hasProfile(profile.data)) {
    return NextResponse.json({ error: "Describe the character, fill in their look, or add a photo." }, { status: 400 });
  }

  const id = randomUUID();
  let keys: string[] = [];
  let tags: string[] = [];

  try {
    if (files.length > 0) {
      keys = await Promise.all(
        files.map(async (f, i) => {
          const key = `u/${user.id}/characters/${id}/${i}.${extFor(f.type)}`;
          await putObject(key, new Uint8Array(await f.arrayBuffer()), f.type);
          return key;
        }),
      );
      tags = keys.map(() => "photo");
    } else if (pickedJob) {
      // A candidate portrait the user chose from the set made by /api/characters/candidates.
      const { data: job } = await admin().from("jobs").select("id, user_id, kind, status, outputs").eq("id", pickedJob).maybeSingle();
      const j = job as { user_id: string; kind: string; status: string; outputs: { key: string }[] } | null;
      if (!j || j.user_id !== user.id || j.kind !== "image" || j.status !== "succeeded" || !j.outputs[0]) {
        return NextResponse.json({ error: "That portrait is no longer available." }, { status: 404 });
      }
      keys = [await adoptOutput(user.id, id, "front", j.outputs[0])];
      tags = ["front"];
    } else {
      const portrait = buildPortraitPrompt({ name: fields.data.name, description: fields.data.description, profile: profile.data });
      const job = await startJob({
        userId: user.id,
        modelKey: await preferredPortraitModel(await createClient(), user.id),
        prompt: `Portrait of ${fields.data.name}`,
        providerPrompt: portrait.text,
        aspectRatio: "3:4",
        promptVersion: portrait.version,
        meta: { portrait: true },
      });
      if (job.status !== "succeeded" || job.outputs.length === 0) {
        return NextResponse.json({ error: "The portrait could not be generated. Your credits were refunded." }, { status: 502 });
      }
      keys = [job.outputs[0].key];
      tags = ["front"];
    }

    const { data, error } = await admin()
      .from("characters")
      .insert({ id, user_id: user.id, name: fields.data.name, description: fields.data.description, niche: fields.data.niche, tone: fields.data.tone, profile: profile.data, reference_keys: keys, reference_tags: tags } as never)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ character: await presentCharacter(data as CharacterRow) });
  } catch (e) {
    if (e instanceof UserFacingError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("create character failed", e);
    return NextResponse.json({ error: "Could not save the character. Try again." }, { status: 500 });
  }
}
