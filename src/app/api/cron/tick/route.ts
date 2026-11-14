import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { advanceDueJobs } from "@/lib/jobs/run";
import { checkLabAlerts } from "@/lib/labs-server";
import { admin } from "@/lib/supabase/admin";

export const maxDuration = 60;

// Called by Supabase pg_cron (see supabase/setup/cron.sql). Two kinds of call, kept apart so an idle
// site costs almost nothing:
//   POST /api/cron/tick                   moves running jobs forward (jobs whose tab was closed).
//   POST /api/cron/tick?task=housekeeping expires old free credits and checks lab balances. Hourly is plenty.
// A caller that still hits the plain URL every minute gets the housekeeping once an hour, at minute 0 UTC.
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const task = new URL(req.url).searchParams.get("task");
  const housekeeping = task === "housekeeping" || (task === null && new Date().getUTCMinutes() === 0);
  const jobs = task === "housekeeping" ? null : await advanceDueJobs();
  if (!housekeeping) return NextResponse.json({ jobs });

  const { data: expired, error } = await admin().rpc("expire_grants");
  if (error) console.error("expire_grants failed", error);
  const alerts = await checkLabAlerts().catch((e) => {
    console.error("lab alert check failed", e);
    return [];
  });
  return NextResponse.json({ jobs, expiredGrants: expired ?? null, alerts });
}
