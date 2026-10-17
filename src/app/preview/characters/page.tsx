import { CharactersView } from "@/components/characters-view";
import { sampleCharacters } from "@/lib/sample";

export default async function PreviewCharacters({ searchParams }: { searchParams: Promise<{ empty?: string; new?: string }> }) {
  const { empty, new: openNew } = await searchParams;
  return <CharactersView base="/preview" characters={empty ? [] : sampleCharacters} portraitCredits={2} openNew={!!openNew} demo />;
}
