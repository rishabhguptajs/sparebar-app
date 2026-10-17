import { StudioView } from "@/components/studio-view";
import { getCharacters, getJob, getJobs, getModelOptions, requireSession } from "@/lib/data";

type SP = { rerun?: string; character?: string };

export default async function StudioPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { rerun, character } = await searchParams;
  const { supabase, user } = await requireSession();
  const [models, characters, recent, source] = await Promise.all([
    getModelOptions(supabase, user.id),
    getCharacters(supabase),
    getJobs(supabase, { limit: 14, succeededOnly: true }),
    rerun ? getJob(supabase, rerun) : null,
  ]);

  const initial = source
    ? { modelKey: source.modelKey, prompt: source.prompt, characterId: source.characterId ?? undefined, aspectRatio: source.aspectRatio ?? undefined }
    : { characterId: characters.some((c) => c.id === character) ? character : undefined };

  return <StudioView key={rerun ?? character ?? "studio"} base="/app" models={models} characters={characters} recent={recent} initial={initial} />;
}
