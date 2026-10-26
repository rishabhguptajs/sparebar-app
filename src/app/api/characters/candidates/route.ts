import { NextResponse } from "next/server";
import { z } from "zod";
import { startJob, UserFacingError } from "@/lib/jobs/run";
import { presentJob } from "@/lib/jobs/present";
import { buildPortraitPrompt } from "@/lib/prompts/build";
import { hasProfile, ProfileSchema } from "@/lib/prompts/profile";
import { preferredPortraitModel } from "@/lib/data";
import { createClient, getUser } from "@/lib/supabase/server";

// Three portraits of the same description at once. The user picks the one that looks right, and that one
// becomes the character's reference (POST /api/characters with pickedJobId). Each portrait costs its own credits.
export const maxDuration = 60;
const CANDIDATE_COUNT = 3;

const Body = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(1000).default(""),
  profile: ProfileSchema.default(ProfileSchema.parse({})),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { name, description, profile } = parsed.data;
  if (description.length < 10 && !hasProfile(profile)) {
    return NextResponse.json({ error: "Describe the character or fill in their look first." }, { status: 400 });
  }

  const portrait = buildPortraitPrompt({ name, description, profile });
  const modelKey = await preferredPortraitModel(await createClient(), user.id, CANDIDATE_COUNT);
  const runs = await Promise.allSettled(
    Array.from({ length: CANDIDATE_COUNT }, () =>
      startJob({
        userId: user.id,
        modelKey,
        prompt: `Portrait of ${name}`,
        providerPrompt: portrait.text,
        aspectRatio: "3:4",
        promptVersion: portrait.version,
        meta: { portrait: true, candidate: true },
      }),
    ),
  );
  const done = runs.flatMap((r) => (r.status === "fulfilled" && r.value.status === "succeeded" && r.value.outputs[0] ? [r.value] : []));
  if (done.length === 0) {
    const refused = runs.find((r): r is PromiseRejectedResult => r.status === "rejected" && r.reason instanceof UserFacingError);
    if (refused) return NextResponse.json({ error: (refused.reason as UserFacingError).message }, { status: (refused.reason as UserFacingError).status });
    return NextResponse.json({ error: "The portraits could not be generated. Your credits were refunded." }, { status: 502 });
  }
  return NextResponse.json({ jobs: await Promise.all(done.map(presentJob)) });
}
