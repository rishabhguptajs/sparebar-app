import "server-only";
import { redirect } from "next/navigation";
import { MODELS } from "@/config/models";
import { creditsForModel } from "@/lib/credits";
import { presentCharacter, type CharacterRow } from "@/lib/characters";
import { presentJob } from "@/lib/jobs/present";
import type { JobRow } from "@/lib/jobs/run";
import { getPausedLabs } from "@/lib/labs-server";
import { getAdapter } from "@/lib/providers";
import { createClient } from "@/lib/supabase/server";
import type { ModelOption } from "@/lib/ui-types";

/** Signed-in user plus a Supabase client that acts as them. Redirects to login otherwise. */
export async function requireSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, user: data.user };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function balanceFor(supabase: Supabase, userId: string, kind: string | null, freeOk: boolean) {
  const { data } = await supabase.rpc("credit_balance", { p_user: userId, p_kind: kind, p_free_ok: freeOk } as never);
  return Number(data ?? 0);
}

export async function getBalance(supabase: Supabase, userId: string) {
  return balanceFor(supabase, userId, null, true);
}

/** Models the user can pick, with what they can spend on each. */
export async function getModelOptions(supabase: Supabase, userId: string): Promise<ModelOption[]> {
  const live = MODELS.filter((m) => m.enabled && getAdapter(m.lab));
  const paused = await getPausedLabs();
  const cache = new Map<string, number>();
  const options: ModelOption[] = [];
  for (const m of live) {
    const k = `${m.kind}:${m.freeEligible}`;
    if (!cache.has(k)) cache.set(k, await balanceFor(supabase, userId, m.kind, m.freeEligible));
    options.push({
      key: m.key,
      label: m.label,
      kind: m.kind,
      credits: creditsForModel(m),
      detail:
        m.kind === "video"
          ? `Around ${m.defaults.seconds ?? 8} seconds, ${m.defaults.resolution ?? "720p"}`
          : `${m.defaults.imageSize ?? "1K"} image`,
      available: cache.get(k) ?? 0,
      paused: paused.has(m.lab),
    });
  }
  return options;
}

export async function getCharacters(supabase: Supabase) {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return Promise.all(((data ?? []) as CharacterRow[]).map(presentCharacter));
}

export async function getJobs(supabase: Supabase, opts: { limit: number; succeededOnly?: boolean }) {
  let q = supabase.from("jobs").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(opts.limit);
  if (opts.succeededOnly) q = q.eq("status", "succeeded");
  const { data } = await q;
  return Promise.all(((data ?? []) as JobRow[]).map(presentJob));
}

export async function getJob(supabase: Supabase, id: string) {
  const { data } = await supabase.from("jobs").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  return data ? presentJob(data as JobRow) : null;
}

export type PaymentRow = {
  id: string;
  product_key: string;
  credits: number;
  currency: "USD" | "INR";
  total_minor: number;
  status: "created" | "paid" | "failed" | "refunded";
  invoice_no: string | null;
  created_at: string;
};

export async function getPayments(supabase: Supabase) {
  const { data } = await supabase
    .from("payments")
    .select("id, product_key, credits, currency, total_minor, status, invoice_no, created_at")
    .in("status", ["paid", "refunded"])
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as PaymentRow[];
}

export type ActivityRow = { id: number; type: string; amount: number; note: string | null; created_at: string };

export async function getActivity(supabase: Supabase) {
  const { data } = await supabase
    .from("credit_entries")
    .select("id, type, amount, note, created_at")
    .neq("type", "settle")
    .order("id", { ascending: false })
    .limit(40);
  return (data ?? []) as ActivityRow[];
}

/** The signed-in user if they are an admin. Admins are set by hand: update profiles set is_admin = true. */
export async function getAdminUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", data.user.id).maybeSingle();
  return (profile as { is_admin?: boolean } | null)?.is_admin ? data.user : null;
}
