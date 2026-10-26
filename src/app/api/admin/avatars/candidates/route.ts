import { NextResponse } from "next/server";
import { z } from "zod";
import { avatarDef, ensureAvatarRow, makeCandidates } from "@/lib/avatars";
import { getAdminUser } from "@/lib/data";

export const maxDuration = 120;

// Makes three front portraits for one roster entry so the owner can pick the best. Spends the lab's cost, not a user's credits.
export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = z.object({ slug: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  const def = parsed.success ? avatarDef(parsed.data.slug) : undefined;
  if (!def) return NextResponse.json({ error: "Unknown avatar." }, { status: 400 });
  try {
    await ensureAvatarRow(def);
    return NextResponse.json({ candidates: await makeCandidates(def) });
  } catch (e) {
    console.error("avatar candidates failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not generate." }, { status: 502 });
  }
}
