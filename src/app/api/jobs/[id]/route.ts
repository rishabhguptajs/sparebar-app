import { NextResponse } from "next/server";
import { advanceJob, load, type JobRow } from "@/lib/jobs/run";
import { presentJob } from "@/lib/jobs/present";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// The open tab polls this. If the job is due, this request also advances it,
// so jobs move along without waiting for the cron tick.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  // RLS limits this to the user's own jobs.
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  let job = data as JobRow;

  if (job.status === "running" && job.next_poll_at && Date.parse(job.next_poll_at) <= Date.now()) {
    try {
      job = (await advanceJob(job.id)) ?? (await load(job.id));
    } catch (e) {
      console.error("advance failed", job.id, e);
    }
  }
  return NextResponse.json({ job: await presentJob(job) });
}
