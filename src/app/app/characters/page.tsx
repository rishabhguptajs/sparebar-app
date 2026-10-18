import { CharactersLoader } from "@/components/loaders";
import { getModel } from "@/config/models";
import { creditsForModel } from "@/lib/credits";

export default async function CharactersPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: openNew } = await searchParams;
  const portrait = getModel("nano-banana-2.1");
  return <CharactersLoader portraitCredits={portrait ? creditsForModel(portrait) : 2} openNew={!!openNew} />;
}
