import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/data";
import { admin } from "@/lib/supabase/admin";

const Body = z.object({
  lab: z.enum(["openrouter", "google", "xai", "minimax", "alibaba"]),
  /** Balance shown in the lab console right now, in US dollars. */
  balanceUsd: z.number().min(0).max(100000),
  lowRunwayDays: z.number().min(0).max(60).optional(),
  lowFloorUsd: z.number().min(0).max(100000).optional(),
  note: z.string().trim().max(200).optional(),
});

// Record a lab balance after a top-up. Spend is estimated from this point on.
export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the values and try again." }, { status: 400 });
  const b = parsed.data;

  const { error } = await admin()
    .from("lab_balances")
    .upsert(
      {
        lab: b.lab,
        recorded: true,
        balance_micros: Math.round(b.balanceUsd * 1_000_000),
        recorded_at: new Date().toISOString(),
        ...(b.lowRunwayDays !== undefined ? { low_runway_days: b.lowRunwayDays } : {}),
        ...(b.lowFloorUsd !== undefined ? { low_floor_micros: Math.round(b.lowFloorUsd * 1_000_000) } : {}),
        note: b.note ?? null,
        billing_error_at: null,
        last_alert_level: null,
      } as never,
      { onConflict: "lab" },
    );
  if (error) return NextResponse.json({ error: "Could not save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
