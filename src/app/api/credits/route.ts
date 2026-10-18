import { NextResponse } from "next/server";
import { regionOf } from "@/lib/country";
import { getActivity, getBalance, getPayments } from "@/lib/data";
import { env } from "@/lib/env";
import { getProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [balance, payments, activity, profile] = await Promise.all([
    getBalance(supabase, data.user.id),
    getPayments(supabase),
    getActivity(supabase),
    getProfile(data.user.id, req.headers),
  ]);
  return NextResponse.json({
    balance,
    payments,
    activity,
    region: regionOf(profile.country),
    savedStateCode: profile.state_code,
    gstRegistered: env.gstRegistered(),
    sellerStateCode: env.sellerStateCode() ?? null,
  });
}
