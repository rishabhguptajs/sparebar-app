import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/data";
import { admin } from "@/lib/supabase/admin";

const Body = z.object({
  id: z.string().uuid(),
  status: z.enum(["paid", "rejected"]),
  note: z.string().trim().max(300).optional(),
});

// Marks a referral payout paid (after you sent the money) or rejected (its earnings go back to the referrer).
export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { error } = await admin().rpc("settle_payout", { p_payout: parsed.data.id, p_status: parsed.data.status, p_note: parsed.data.note ?? null } as never);
  if (error) return NextResponse.json({ error: error.message.includes("not open") ? "That payout is already settled." : "Could not update the payout." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
