import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { extFor, putObject } from "@/lib/r2";
import { getUser } from "@/lib/supabase/server";

// A product photo for one generation. The browser shrinks it first, as with character photos.
const MAX_BYTES = 1.4 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Add a photo." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Photos must be PNG, JPG or WebP." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is too large. Try a smaller one." }, { status: 400 });
  const key = `u/${user.id}/products/${randomUUID()}.${extFor(file.type)}`;
  await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  return NextResponse.json({ key });
}
