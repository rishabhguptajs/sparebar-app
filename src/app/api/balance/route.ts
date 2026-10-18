import { NextResponse } from "next/server";
import { getBalance } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ balance: await getBalance(supabase, data.user.id) });
}
