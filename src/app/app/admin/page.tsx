import { notFound } from "next/navigation";
import { MODELS } from "@/config/models";
import { AdminView } from "@/components/admin-view";
import { getAdminUser } from "@/lib/data";
import { getLabStats } from "@/lib/labs-server";
import type { MarginRow } from "@/lib/margin";
import { admin } from "@/lib/supabase/admin";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!(await getAdminUser())) notFound();
  const { days: raw } = await searchParams;
  const days = raw === undefined ? 30 : Number(raw) || null; // 0 or invalid means all time
  const db = admin();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [labs, margins, freeRows, payRows] = await Promise.all([
    getLabStats(),
    db.rpc("model_margins", { p_days: days } as never),
    db.from("free_grants").select("reason").gte("created_at", since),
    db.from("payments").select("currency, total_minor").eq("status", "paid").gte("paid_at", since),
  ]);

  const freeCounts = new Map<string, number>();
  for (const r of (freeRows.data ?? []) as { reason: string }[]) freeCounts.set(r.reason, (freeCounts.get(r.reason) ?? 0) + 1);
  const payTotals = new Map<string, { count: number; total_minor: number }>();
  for (const p of (payRows.data ?? []) as { currency: string; total_minor: number }[]) {
    const cur = payTotals.get(p.currency) ?? { count: 0, total_minor: 0 };
    payTotals.set(p.currency, { count: cur.count + 1, total_minor: cur.total_minor + Number(p.total_minor) });
  }

  return (
    <AdminView
      base="/app"
      labs={labs}
      margins={(margins.data ?? []) as MarginRow[]}
      days={days}
      modelNames={Object.fromEntries(MODELS.map((m) => [m.key, m.label]))}
      free={[...freeCounts].map(([reason, count]) => ({ reason, count }))}
      payments={[...payTotals].map(([currency, v]) => ({ currency, ...v }))}
    />
  );
}
