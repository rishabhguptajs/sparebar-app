import { StudioLoader } from "@/components/loaders";

type SP = { rerun?: string; character?: string; welcome?: string };

export default async function StudioPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { rerun, character, welcome } = await searchParams;
  return <StudioLoader rerun={rerun} character={character} welcome={welcome} />;
}
