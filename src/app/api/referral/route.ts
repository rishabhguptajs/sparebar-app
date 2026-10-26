import { NextResponse } from "next/server";
import { referralEnabled } from "@/config/referral";
import { referralSummary } from "@/lib/referral";
import { getUser } from "@/lib/supabase/server";

// Everything the Referrals page shows: the user's link, who they referred, what they earned and their payouts.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!referralEnabled()) return NextResponse.json({ error: "Referrals are off." }, { status: 404 });
  return NextResponse.json(await referralSummary(user.id));
}
