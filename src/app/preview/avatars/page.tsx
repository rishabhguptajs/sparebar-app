import { AvatarsView } from "@/components/avatars-view";
import { AVATARS } from "@/config/avatars";
import { sampleAvatarArt } from "@/lib/sample";
import type { AvatarCard } from "@/lib/ui-types";

// The real roster with stand-in pictures: the portraits are not generated yet.
const cards: AvatarCard[] = AVATARS.map((a, i) => ({
  id: a.slug,
  slug: a.slug,
  name: a.name,
  gender: a.gender,
  niches: a.niches,
  tagline: a.tagline,
  description: a.description,
  tone: a.tone,
  ageRange: a.profile.ageRange,
  coverUrl: sampleAvatarArt(i),
  photoUrls: [sampleAvatarArt(i), sampleAvatarArt(i + 1), sampleAvatarArt(i + 2)],
  brandCount: i % 4 === 0 ? i + 2 : 0,
  active: true,
}));

export default async function PreviewAvatars({ searchParams }: { searchParams: Promise<{ empty?: string }> }) {
  const { empty } = await searchParams;
  return <AvatarsView base="/preview" avatars={empty ? [] : cards} demo />;
}
