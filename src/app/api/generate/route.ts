import { NextResponse } from "next/server";
import { z } from "zod";
import { characterPrompt, loadReferences, type CharacterRow } from "@/lib/characters";
import { getModel } from "@/config/models";
import { startJob, UserFacingError } from "@/lib/jobs/run";
import { presentJob } from "@/lib/jobs/present";
import { createClient, getUser } from "@/lib/supabase/server";

// Image models answer inside this request. Video returns at once with status "running".
export const maxDuration = 60;

const Body = z.object({
  modelKey: z.string().min(1),
  prompt: z.string().trim().min(1).max(4000),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5", "3:4", "4:3"]).optional(),
  characterId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const { characterId, ...rest } = parsed.data;
    let providerPrompt: string | undefined;
    let references;
    if (characterId) {
      const supabase = await createClient();
      const { data } = await supabase.from("characters").select("*").eq("id", characterId).is("deleted_at", null).maybeSingle();
      if (!data) return NextResponse.json({ error: "That character is no longer available." }, { status: 404 });
      const character = data as CharacterRow;
      // Video takes one reference photo, images take up to three.
      references = await loadReferences(character, getModel(rest.modelKey)?.kind === "video" ? 1 : 3);
      providerPrompt = characterPrompt(character, rest.prompt);
    }
    const job = await startJob({ userId: user.id, ...rest, characterId, providerPrompt, references });
    return NextResponse.json({ job: await presentJob(job) });
  } catch (e) {
    if (e instanceof UserFacingError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("generate failed", e);
    return NextResponse.json({ error: "Something went wrong. Your credits were not used." }, { status: 500 });
  }
}
