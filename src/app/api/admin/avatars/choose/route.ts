import { NextResponse } from "next/server";
import { z } from "zod";
import { avatarDef, chooseFront } from "@/lib/avatars";
import { getAdminUser } from "@/lib/data";

export const maxDuration = 120;

// Keeps the chosen portrait and makes the side and full body shots from it. The avatar stays hidden until activated.
export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = z.object({ slug: z.string().min(1), key: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  const def = parsed.success ? avatarDef(parsed.data.slug) : undefined;
  if (!parsed.success || !def) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    return NextResponse.json(await chooseFront(def, parsed.data.key));
  } catch (e) {
    console.error("avatar choose failed", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save." }, { status: 502 });
  }
}
