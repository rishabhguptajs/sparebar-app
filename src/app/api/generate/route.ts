import { NextResponse } from "next/server";
import { z } from "zod";
import { startJob, UserFacingError } from "@/lib/jobs/run";
import { presentJob } from "@/lib/jobs/present";
import { getUser } from "@/lib/supabase/server";

// Image models answer inside this request. Video returns at once with status "running".
export const maxDuration = 60;

const Body = z.object({
  modelKey: z.string().min(1),
  prompt: z.string().trim().min(1).max(4000),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5", "3:4", "4:3"]).optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const job = await startJob({ userId: user.id, ...parsed.data });
    return NextResponse.json({ job: await presentJob(job) });
  } catch (e) {
    if (e instanceof UserFacingError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("generate failed", e);
    return NextResponse.json({ error: "Something went wrong. Your credits were not used." }, { status: 500 });
  }
}
