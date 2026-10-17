import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { presentCharacter, type CharacterRow } from "@/lib/characters";
import { startJob, UserFacingError } from "@/lib/jobs/run";
import { extFor, putObject } from "@/lib/r2";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export const maxDuration = 60;

const MAX_FILES = 3;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const Fields = z.object({
  name: z.string().trim().min(1, "Give the character a name.").max(60),
  description: z.string().trim().max(1000),
});

// Creates a character from uploaded photos, or, with no photos, from a generated portrait.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const fields = Fields.safeParse({ name: form.get("name") ?? "", description: form.get("description") ?? "" });
  if (!fields.success) return NextResponse.json({ error: fields.error.issues[0].message }, { status: 400 });

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Add up to ${MAX_FILES} photos.` }, { status: 400 });
  for (const f of files) {
    if (!ALLOWED.has(f.type)) return NextResponse.json({ error: "Photos must be PNG, JPG or WebP." }, { status: 400 });
    if (f.size > MAX_BYTES) return NextResponse.json({ error: "Each photo must be under 8 MB." }, { status: 400 });
  }
  if (files.length === 0 && fields.data.description.length < 10) {
    return NextResponse.json({ error: "Describe the character in a sentence, or add a photo." }, { status: 400 });
  }

  const id = randomUUID();
  let keys: string[] = [];

  try {
    if (files.length > 0) {
      keys = await Promise.all(
        files.map(async (f, i) => {
          const key = `u/${user.id}/characters/${id}/${i}.${extFor(f.type)}`;
          await putObject(key, new Uint8Array(await f.arrayBuffer()), f.type);
          return key;
        }),
      );
    } else {
      const job = await startJob({
        userId: user.id,
        modelKey: "nano-banana-2.1",
        prompt: `Portrait of ${fields.data.name}`,
        providerPrompt: `Portrait photo for a character reference. ${fields.data.description}. Face clearly visible, natural light, plain background, shot on a phone camera.`,
        aspectRatio: "3:4",
      });
      if (job.status !== "succeeded" || job.outputs.length === 0) {
        return NextResponse.json({ error: "The portrait could not be generated. Your credits were refunded." }, { status: 502 });
      }
      keys = [job.outputs[0].key];
    }

    const { data, error } = await admin()
      .from("characters")
      .insert({ id, user_id: user.id, name: fields.data.name, description: fields.data.description, reference_keys: keys } as never)
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
