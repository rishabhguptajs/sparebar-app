import type { User } from "@supabase/supabase-js";
import { countryFromHeaders } from "@/lib/country";
import { admin } from "@/lib/supabase/admin";

type ProfileRow = { country: string | null; full_name: string | null };

/** Fills in details we can learn at sign-in. Never overwrites something already set. */
export async function recordProfile(user: User, headers: Headers) {
  const db = admin();
  const { data, error } = await db.from("profiles").select("country, full_name").eq("id", user.id).maybeSingle();
  if (error) console.error("profile read failed", error.message);
  const row = data as ProfileRow | null;
  const patch: Record<string, string> = {};
  const country = countryFromHeaders(headers);
  if (!row?.country && country) patch.country = country;
  const name = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
  if (!row?.full_name && name) patch.full_name = name;
  if (Object.keys(patch).length) {
    const { error: saveError } = await db.from("profiles").update(patch as never).eq("id", user.id);
    if (saveError) console.error("profile save failed", saveError.message);
  }
}
