import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

// Lets a buyer correct the detected region (a VPN, or travelling). It decides whether GST applies.
const Body = z.object({ india: z.boolean() });

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { error } = await admin()
    .from("profiles")
    .update({ country: parsed.data.india ? "IN" : "ZZ" } as never)
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
