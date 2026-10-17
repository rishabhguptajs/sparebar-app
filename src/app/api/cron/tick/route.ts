import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { advanceDueJobs } from "@/lib/jobs/run";
import { admin } from "@/lib/supabase/admin";

export const maxDuration = 60;

// Called every minute by Supabase pg_cron (see supabase/setup/cron.sql).
// Advances jobs whose tab was closed and expires old free credits.
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const jobs = await advanceDueJobs();
  const { data: expired, error } = await admin().rpc("expire_grants");
  if (error) console.error("expire_grants failed", error);
  return NextResponse.json({ jobs, expiredGrants: expired ?? null });
}
