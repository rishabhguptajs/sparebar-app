import { NextResponse } from "next/server";
import { z } from "zod";
import { presentCharacter, type CharacterRow } from "@/lib/characters";
import { ProfileSchema } from "@/lib/prompts/profile";
import { admin } from "@/lib/supabase/admin";
import { createClient, getUser } from "@/lib/supabase/server";

// Removes a character from the user's list. Past generations keep working.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;

  const { error } = await admin()
    .from("characters")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not remove the character." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

const Patch = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  description: z.string().trim().max(1000).optional(),
  niche: z.string().trim().max(80).optional(),
  tone: z.string().trim().max(80).optional(),
  profile: ProfileSchema.optional(),
  /** Remove the reference photo at this position. The first photo cannot be removed while it is the only one. */
  removeReference: z.number().int().min(0).max(9).optional(),
});

// Edits the look, the persona or the reference photos of a character.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { removeReference, ...changes } = parsed.data;

  const supabase = await createClient();
  const { data } = await supabase.from("characters").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  const row = data as CharacterRow | null;
  if (!row) return NextResponse.json({ error: "That character is no longer available." }, { status: 404 });

  const update: Record<string, unknown> = { ...changes };
  if (removeReference !== undefined) {
    if (row.reference_keys.length <= 1) return NextResponse.json({ error: "A character needs at least one photo." }, { status: 400 });
    if (removeReference >= row.reference_keys.length) return NextResponse.json({ error: "That photo does not exist." }, { status: 400 });
    const tags = row.reference_tags?.length === row.reference_keys.length ? row.reference_tags : row.reference_keys.map(() => "photo");
    update.reference_keys = row.reference_keys.filter((_, i) => i !== removeReference);
    update.reference_tags = tags.filter((_, i) => i !== removeReference);
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ character: await presentCharacter(row) });

  const { data: saved, error } = await admin().from("characters").update(update as never).eq("id", id).eq("user_id", user.id).select("*").single();
  if (error) return NextResponse.json({ error: "Could not save the changes." }, { status: 500 });
  return NextResponse.json({ character: await presentCharacter(saved as CharacterRow) });
}
