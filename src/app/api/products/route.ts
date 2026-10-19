import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getProducts } from "@/lib/data";
import { extFor, putObject } from "@/lib/r2";
import { admin } from "@/lib/supabase/admin";
import { createClient, getUser } from "@/lib/supabase/server";

// A saved product: a name, a one line pitch, a main photo and optionally a close up of the label.
// Saved once, used in any number of posts, so the product looks the same each time.
const MAX_PRODUCTS = 30;
const MAX_BYTES = 1.4 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const Fields = z.object({
  name: z.string().trim().min(1, "Give the product a name.").max(80),
  pitch: z.string().trim().max(200).default(""),
});

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ products: await getProducts(await createClient()) });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const fields = Fields.safeParse({ name: form.get("name") ?? "", pitch: form.get("pitch") ?? "" });
  if (!fields.success) return NextResponse.json({ error: fields.error.issues[0].message }, { status: 400 });

  const main = form.get("photo");
  const label = form.get("label");
  if (!(main instanceof File) || main.size === 0) return NextResponse.json({ error: "Add a photo of the product." }, { status: 400 });
  const labelFile = label instanceof File && label.size > 0 ? label : null;
  for (const f of [main, labelFile]) {
    if (!f) continue;
    if (!ALLOWED.has(f.type)) return NextResponse.json({ error: "Photos must be PNG, JPG or WebP." }, { status: 400 });
    if (f.size > MAX_BYTES) return NextResponse.json({ error: "That photo is too large. Try a smaller one." }, { status: 400 });
  }

  const supabase = await createClient();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null);
  if ((count ?? 0) >= MAX_PRODUCTS) return NextResponse.json({ error: `You can save up to ${MAX_PRODUCTS} products.` }, { status: 400 });

  try {
    const keyFor = (f: File) => `u/${user.id}/products/${randomUUID()}.${extFor(f.type)}`;
    const mainKey = keyFor(main);
    await putObject(mainKey, new Uint8Array(await main.arrayBuffer()), main.type);
    let labelKey: string | null = null;
    if (labelFile) {
      labelKey = keyFor(labelFile);
      await putObject(labelKey, new Uint8Array(await labelFile.arrayBuffer()), labelFile.type);
    }
    const { error } = await admin()
      .from("products")
      .insert({ user_id: user.id, name: fields.data.name, pitch: fields.data.pitch, photo_keys: [mainKey], label_key: labelKey } as never);
    if (error) throw error;
    return NextResponse.json({ products: await getProducts(supabase) });
  } catch (e) {
    console.error("create product failed", e);
    return NextResponse.json({ error: "Could not save the product. Try again." }, { status: 500 });
  }
}
