import { NextResponse } from "next/server";
import { getActivity, getPayments } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [payments, activity] = await Promise.all([getPayments(supabase), getActivity(supabase)]);
  return NextResponse.json({ payments, activity });
}
