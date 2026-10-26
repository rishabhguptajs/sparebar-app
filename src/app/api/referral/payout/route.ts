import { NextResponse } from "next/server";
import { REFERRAL, creditsPerDollar, referralEnabled } from "@/config/referral";
import { PayoutDetails, destinationOf } from "@/lib/payout-details";
import { notifyOwner } from "@/lib/notify";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

// Asks for everything available to be paid out. The owner pays by hand and marks it paid in admin.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!referralEnabled()) return NextResponse.json({ error: "Referrals are off." }, { status: 404 });
  const parsed = PayoutDetails.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the payout details." }, { status: 400 });

  const credits = parsed.data.method === "credits";
  const min = credits ? REFERRAL.minCreditPayoutCents : REFERRAL.minPayoutCents;

  const { data, error } = await admin().rpc("request_payout", {
    p_user: user.id,
    p_method: parsed.data.method,
    p_destination: destinationOf(parsed.data),
    p_min_cents: min,
    p_credits_per_dollar: credits ? creditsPerDollar() : 0,
  } as never);
  if (error) {
    if (error.message.includes("below_minimum")) return NextResponse.json({ error: `You can request a payout once $${min / 100} is available.` }, { status: 409 });
    if (error.message.includes("payout_open")) return NextResponse.json({ error: "You already have a payout waiting." }, { status: 409 });
    console.error("payout request failed", error.message);
    return NextResponse.json({ error: "Could not request the payout." }, { status: 500 });
  }
  if (credits) return NextResponse.json({ ok: true, credits: true });
  notifyOwner("Sparebar payout requested", [`User: ${user.email ?? user.id}`, `Method: ${parsed.data.method}`, `Payout: ${data}`]);
  return NextResponse.json({ ok: true });
}
