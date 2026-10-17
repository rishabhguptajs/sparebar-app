import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/data";
import { admin } from "@/lib/supabase/admin";

const Body = z.object({
  email: z.string().trim().email(),
  credits: z.number().int().min(1).max(100000),
  note: z.string().trim().max(200).optional(),
});

// Give credits to a user by email, for support or testing. Shows in their activity as added credits.
export async function POST(req: Request) {
  const who = await getAdminUser();
  if (!who) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter an email and a whole number of credits." }, { status: 400 });
  const { email, credits } = parsed.data;

  const { data: profile } = await admin().from("profiles").select("id").eq("email", email.toLowerCase()).maybeSingle();
  const id = (profile as { id: string } | null)?.id;
  if (!id) return NextResponse.json({ error: `No account for ${email.toLowerCase()}. They need to sign in once first.` }, { status: 404 });

  const { error } = await admin().rpc("grant_credits", {
    p_user: id,
    p_amount: credits,
    p_bucket: "paid",
    p_source: "admin",
    p_source_ref: `admin:${randomUUID()}`,
  } as never);
  if (error) return NextResponse.json({ error: "Could not add credits." }, { status: 500 });
  return NextResponse.json({ ok: true, email: email.toLowerCase(), credits });
}
