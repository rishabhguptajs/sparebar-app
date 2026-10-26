import { NextResponse } from "next/server";
import { getActivity, getBalance, getPayments } from "@/lib/data";
import { eligibleForFriendDiscount } from "@/lib/referral";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [balance, payments, activity, friendDiscount] = await Promise.all([
    getBalance(supabase, data.user.id),
    getPayments(supabase),
    getActivity(supabase),
    eligibleForFriendDiscount(data.user.id),
  ]);
  return NextResponse.json({ balance, payments, activity, friendDiscount });
}
