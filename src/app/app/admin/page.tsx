import { notFound } from "next/navigation";
import { MODELS } from "@/config/models";
import { AdminView } from "@/components/admin-view";
import { parseTab } from "@/lib/admin-tabs";
import { getAdminUser } from "@/lib/data";
import { getLabStats } from "@/lib/labs-server";
import type { MarginRow } from "@/lib/margin";
import { REFERRAL } from "@/config/referral";
import { admin } from "@/lib/supabase/admin";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string; tab?: string }> }) {
  if (!(await getAdminUser())) notFound();
  const { days: raw, tab: rawTab } = await searchParams;
  const tab = parseTab(rawTab);
  const days = raw === undefined ? 30 : Number(raw) || null; // 0 or invalid means all time
  const db = admin();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [labs, margins, freeRows, payRows, recentUsers, userCounts, recentPayRows] = await Promise.all([
    getLabStats(),
    db.rpc("model_margins", { p_days: days } as never),
    db.from("free_grants").select("reason").gte("created_at", since),
    db.from("payments").select("currency, total_minor").eq("status", "paid").gte("paid_at", since),
    db.from("profiles").select("id, email, country, created_at").order("created_at", { ascending: false }).limit(50),
    db.from("profiles").select("created_at").gte("created_at", since),
    db.from("payments").select("user_id, credits, total_minor, status, created_at, paid_at").in("status", ["paid", "refunded"]).order("created_at", { ascending: false }).limit(20),
  ]);

  const users = (recentUsers.data ?? []) as { id: string; email: string | null; country: string | null; created_at: string }[];
  const recentPays = (recentPayRows.data ?? []) as { user_id: string; credits: number; total_minor: number; status: string; created_at: string }[];
  const ids = [...new Set([...users.map((u) => u.id), ...recentPays.map((p) => p.user_id)])];
  const [{ count: totalUsers }, jobRows, paidRows, emailRows, grantRows] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("jobs").select("user_id").in("user_id", ids).eq("status", "succeeded"),
    db.from("payments").select("user_id").in("user_id", ids).eq("status", "paid"),
    db.from("profiles").select("id, email").in("id", ids),
    db.from("credit_grants").select("user_id, remaining, expires_at").in("user_id", ids).gt("remaining", 0),
  ]);
  const jobsBy = new Map<string, number>();
  for (const j of (jobRows.data ?? []) as { user_id: string }[]) jobsBy.set(j.user_id, (jobsBy.get(j.user_id) ?? 0) + 1);
  const paidSet = new Set(((paidRows.data ?? []) as { user_id: string }[]).map((p) => p.user_id));
  const emailBy = new Map(((emailRows.data ?? []) as { id: string; email: string | null }[]).map((r) => [r.id, r.email]));
  const balanceBy = new Map<string, number>();
  const nowMs = Date.now();
  for (const g of (grantRows.data ?? []) as { user_id: string; remaining: number; expires_at: string | null }[]) {
    if (g.expires_at && Date.parse(g.expires_at) <= nowMs) continue;
    balanceBy.set(g.user_id, (balanceBy.get(g.user_id) ?? 0) + g.remaining);
  }
  const dayAgo = Date.now() - 86_400_000;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const signupTimes = ((userCounts.data ?? []) as { created_at: string }[]).map((r) => Date.parse(r.created_at));

  const freeCounts = new Map<string, number>();
  for (const r of (freeRows.data ?? []) as { reason: string }[]) freeCounts.set(r.reason, (freeCounts.get(r.reason) ?? 0) + 1);
  const payTotals = new Map<string, { count: number; total_minor: number }>();
  for (const p of (payRows.data ?? []) as { currency: string; total_minor: number }[]) {
    const cur = payTotals.get(p.currency) ?? { count: 0, total_minor: 0 };
    payTotals.set(p.currency, { count: cur.count + 1, total_minor: cur.total_minor + Number(p.total_minor) });
  }

  // Referrals: who refers, what they earned, and the payouts waiting for you.
  const [refProfiles, refEarnings, payoutRows] = await Promise.all([
    db.from("profiles").select("referred_by").not("referred_by", "is", null),
    db.from("referral_earnings").select("referrer_id, amount_cents").eq("status", "active"),
    db.from("referral_payouts").select("id, referrer_id, amount_cents, method, destination, status, note, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  const referredBy = new Map<string, number>();
  for (const r of (refProfiles.data ?? []) as { referred_by: string }[]) referredBy.set(r.referred_by, (referredBy.get(r.referred_by) ?? 0) + 1);
  const earnedBy = new Map<string, number>();
  for (const e of (refEarnings.data ?? []) as { referrer_id: string; amount_cents: number }[]) earnedBy.set(e.referrer_id, (earnedBy.get(e.referrer_id) ?? 0) + e.amount_cents);
  const payouts = (payoutRows.data ?? []) as { id: string; referrer_id: string; amount_cents: number; method: string; destination: string; status: string; note: string | null; created_at: string }[];
  const refIds = [...new Set([...referredBy.keys(), ...earnedBy.keys(), ...payouts.map((p) => p.referrer_id)])];
  const refEmails = new Map<string, string | null>();
  if (refIds.length) {
    const { data: rows } = await db.from("profiles").select("id, email").in("id", refIds);
    for (const r of (rows ?? []) as { id: string; email: string | null }[]) refEmails.set(r.id, r.email);
  }
  const referrers = refIds
    .map((id) => {
      const referred = referredBy.get(id) ?? 0;
      const earnedCents = earnedBy.get(id) ?? 0;
      return { id, email: refEmails.get(id) ?? null, referred, earnedCents, flagged: earnedCents >= REFERRAL.flagEarnedCents || referred >= REFERRAL.flagReferred };
    })
    .sort((a, b) => b.earnedCents - a.earnedCents)
    .slice(0, 50);
  const flaggedIds = new Set(referrers.filter((r) => r.flagged).map((r) => r.id));

  return (
    <AdminView
      base="/app"
      labs={labs}
      margins={(margins.data ?? []) as MarginRow[]}
      days={days}
      tab={tab}
      referrers={referrers}
      payouts={payouts.map((p) => ({ id: p.id, email: refEmails.get(p.referrer_id) ?? null, amountCents: p.amount_cents, method: p.method, destination: p.destination, status: p.status, note: p.note, createdAt: p.created_at, flagged: flaggedIds.has(p.referrer_id) }))}
      modelNames={Object.fromEntries(MODELS.map((m) => [m.key, m.label]))}
      free={[...freeCounts].map(([reason, count]) => ({ reason, count }))}
      payments={[...payTotals].map(([currency, v]) => ({ currency, ...v }))}
      signups={{ total: totalUsers ?? users.length, today: signupTimes.filter((t) => t > dayAgo).length, week: signupTimes.filter((t) => t > weekAgo).length, month: signupTimes.length }}
      users={users.map((u) => ({
        id: u.id,
        email: u.email,
        country: u.country,
        created_at: u.created_at,
        balance: balanceBy.get(u.id) ?? 0,
        jobs: jobsBy.get(u.id) ?? 0,
        paid: paidSet.has(u.id),
      }))}
      recentPayments={recentPays.map((p) => ({ email: emailBy.get(p.user_id) ?? null, credits: p.credits, total_minor: Number(p.total_minor), status: p.status, created_at: p.created_at }))}
    />
  );
}
