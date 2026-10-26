import { NextResponse } from "next/server";
import { z } from "zod";
import { avatarDef, setAvatarActive } from "@/lib/avatars";
import { getAdminUser } from "@/lib/data";

// Shows an avatar to brands, or hides it again.
export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = z.object({ slug: z.string().min(1), active: z.boolean() }).safeParse(await req.json().catch(() => null));
  const def = parsed.success ? avatarDef(parsed.data.slug) : undefined;
  if (!parsed.success || !def) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    await setAvatarActive(def, parsed.data.active);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not update." }, { status: 400 });
  }
}
