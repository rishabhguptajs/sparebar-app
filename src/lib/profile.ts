import type { User } from "@supabase/supabase-js";
import { countryFromHeaders } from "@/lib/country";
import { admin } from "@/lib/supabase/admin";

type ProfileRow = { country: string | null; state_code: string | null; full_name: string | null };

/** Fills in details we can learn at sign-in. Never overwrites something already set. */
export async function recordProfile(user: User, headers: Headers) {
  const db = admin();
  const { data } = await db.from("profiles").select("country, state_code, full_name").eq("id", user.id).maybeSingle();
  const row = data as ProfileRow | null;
  const patch: Record<string, string> = {};
  const country = countryFromHeaders(headers);
  if (!row?.country && country) patch.country = country;
  const name = (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined;
  if (!row?.full_name && name) patch.full_name = name;
  if (Object.keys(patch).length) await db.from("profiles").update(patch as never).eq("id", user.id);
}

export async function getProfile(userId: string, headers: Headers): Promise<ProfileRow> {
  const { data } = await admin().from("profiles").select("country, state_code, full_name").eq("id", userId).maybeSingle();
  const row = (data as ProfileRow | null) ?? { country: null, state_code: null, full_name: null };
  // Older accounts and sign-ins from a place the host cannot see: try the current request.
  return { ...row, country: row.country ?? countryFromHeaders(headers) };
}
