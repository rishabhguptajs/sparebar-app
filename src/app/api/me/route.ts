import { NextResponse } from "next/server";
import { getBalance } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

// What the app shell needs on every page: the balance and whether to show the Admin link.
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [balance, profile] = await Promise.all([
    getBalance(supabase, data.user.id),
    supabase.from("profiles").select("is_admin").eq("id", data.user.id).maybeSingle(),
  ]);
  return NextResponse.json({ balance, isAdmin: !!(profile.data as { is_admin?: boolean } | null)?.is_admin });
}
