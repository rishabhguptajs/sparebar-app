import { StudioView } from "@/components/studio-view";
import { FREE_TIER } from "@/config/free-tier";
import { getCharacters, getJob, getJobs, getModelOptions, requireSession } from "@/lib/data";

type SP = { rerun?: string; character?: string; welcome?: string };

export default async function StudioPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { rerun, character, welcome } = await searchParams;
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

  const notice =
    welcome === "granted"
      ? `You have ${FREE_TIER.credits} free credits, enough for one image. They work for images only and expire in ${FREE_TIER.expiresDays} days.`
      : welcome === "denied"
        ? "Free credits were already claimed from this device or email. You can add credits to keep going."
        : undefined;

  return (
    <StudioView key={rerun ?? character ?? "studio"} base="/app" models={models} characters={characters} recent={recent} initial={initial} notice={notice} />
  );
}
