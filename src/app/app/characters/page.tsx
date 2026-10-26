import { CharactersLoader } from "@/components/loaders";
import { getModel } from "@/config/models";
import { creditsForModel } from "@/lib/credits";
import { preferredPortraitModel } from "@/lib/data";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function CharactersPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: openNew } = await searchParams;
  const user = await getUser();
  const portrait = getModel(user ? await preferredPortraitModel(await createClient(), user.id) : "qwen-image-3");
  return <CharactersLoader portraitCredits={portrait ? creditsForModel(portrait) : 2} openNew={!!openNew} />;
}
