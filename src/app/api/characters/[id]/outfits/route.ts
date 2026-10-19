import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { presentOutfit, type OutfitRow } from "@/lib/characters";
import { extFor, putObject } from "@/lib/r2";
import { admin } from "@/lib/supabase/admin";
import { createClient, getUser } from "@/lib/supabase/server";

// A saved outfit for a character: a name, words describing it, and optionally a photo of it.
// Pick it when making a post and the character wears the same thing every time.
const MAX_OUTFITS = 12;
const MAX_BYTES = 1.4 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const Fields = z.object({
  name: z.string().trim().min(1, "Give the outfit a name.").max(60),
  description: z.string().trim().max(200).default(""),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const fields = Fields.safeParse({ name: form.get("name") ?? "", description: form.get("description") ?? "" });
  if (!fields.success) return NextResponse.json({ error: fields.error.issues[0].message }, { status: 400 });
  const photo = form.get("photo");
  const file = photo instanceof File && photo.size > 0 ? photo : null;
  if (file && !ALLOWED.has(file.type)) return NextResponse.json({ error: "Photos must be PNG, JPG or WebP." }, { status: 400 });
  if (file && file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is too large. Try a smaller one." }, { status: 400 });
  if (!file && !fields.data.description) return NextResponse.json({ error: "Describe the outfit or add a photo of it." }, { status: 400 });

  const supabase = await createClient();
  const { data: character } = await supabase.from("characters").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!character) return NextResponse.json({ error: "That character is no longer available." }, { status: 404 });
  const { count } = await supabase.from("outfits").select("id", { count: "exact", head: true }).eq("character_id", id).is("deleted_at", null);
  if ((count ?? 0) >= MAX_OUTFITS) return NextResponse.json({ error: `A character holds up to ${MAX_OUTFITS} outfits.` }, { status: 400 });

  try {
    const outfitId = randomUUID();
    const photoKey = file ? `u/${user.id}/outfits/${outfitId}.${extFor(file.type)}` : null;
    if (file && photoKey) await putObject(photoKey, new Uint8Array(await file.arrayBuffer()), file.type);
    const { data, error } = await admin()
      .from("outfits")
      .insert({ id: outfitId, user_id: user.id, character_id: id, name: fields.data.name, description: fields.data.description, photo_key: photoKey } as never)
      .select("id, character_id, name, description, photo_key")
      .single();
    if (error) throw error;
    return NextResponse.json({ outfit: await presentOutfit(data as OutfitRow) });
  } catch (e) {
    console.error("create outfit failed", e);
    return NextResponse.json({ error: "Could not save the outfit. Try again." }, { status: 500 });
  }
}
