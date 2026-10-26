import { notFound } from "next/navigation";
import { AvatarAdmin } from "@/components/avatar-admin";
import { AVATARS } from "@/config/avatars";
import { listAllAvatars } from "@/lib/avatars";
import { getAdminUser } from "@/lib/data";

export default async function AdminAvatarsPage() {
  if (!(await getAdminUser())) notFound();
  const rows = await listAllAvatars();
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return (
    <AvatarAdmin
      entries={AVATARS.map((d) => ({
        slug: d.slug,
        name: d.name,
        gender: d.gender,
        niches: d.niches,
        tagline: d.tagline,
        ageRange: d.profile.ageRange,
        description: d.description,
        saved: bySlug.get(d.slug) ?? null,
      }))}
    />
  );
}
