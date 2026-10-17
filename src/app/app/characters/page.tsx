import { CharactersView } from "@/components/characters-view";
import { getModel } from "@/config/models";
import { creditsForModel } from "@/lib/credits";
import { getCharacters, requireSession } from "@/lib/data";

export default async function CharactersPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: openNew } = await searchParams;
  const { supabase } = await requireSession();
  const characters = await getCharacters(supabase);
  const portrait = getModel("nano-banana-2.1");
  return <CharactersView base="/app" characters={characters} portraitCredits={portrait ? creditsForModel(portrait) : 2} openNew={!!openNew} />;
}
