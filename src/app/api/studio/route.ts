import { NextResponse } from "next/server";
import { getCharacters, getJob, getJobs, getModelOptions } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

// Everything the studio needs: models with what the user can spend on each, characters, recent results,
// and, for "run again", the settings of the job being repeated.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rerun = url.searchParams.get("rerun");
  const character = url.searchParams.get("character");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [models, characters, recent, source] = await Promise.all([
    getModelOptions(supabase, data.user.id),
    getCharacters(supabase),
    getJobs(supabase, { limit: 14, succeededOnly: true }),
    rerun ? getJob(supabase, rerun) : null,
  ]);
  const initial = source
    ? { modelKey: source.modelKey, prompt: source.prompt, characterId: source.characterId ?? undefined, aspectRatio: source.aspectRatio ?? undefined }
    : { characterId: characters.some((c) => c.id === character) ? (character ?? undefined) : undefined };
  return NextResponse.json({ models, characters, recent, initial });
}
