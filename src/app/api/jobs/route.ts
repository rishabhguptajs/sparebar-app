import { NextResponse } from "next/server";
import { getJobs } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

// The library: the user's recent jobs, newest first.
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ jobs: await getJobs(supabase, { limit: 120 }) });
}
