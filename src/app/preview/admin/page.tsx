import { AdminView } from "@/components/admin-view";
import { parseTab } from "@/lib/admin-tabs";
import type { LabStat } from "@/lib/labs";

const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const stat = (o: Partial<LabStat> & { lab: string }): LabStat => ({
  has_balance: false,
  balance_micros: 0,
  recorded_at: null,
  spent_since_micros: 0,
  spent_7d_micros: 0,
  first_job_at: null,
  low_runway_days: 3,
  low_floor_micros: 5_000_000,
  last_alert_at: null,
  last_alert_level: null,
  billing_error_at: null,
  note: null,
  ...o,
});

export default async function PreviewAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams;
  const tab = parseTab(rawTab);
  return (
    <AdminView
      base="/preview"
      demo
      days={30}
      referrers={[
        { id: "r1", email: "priya@example.com", referred: 24, earnedCents: 18450, flagged: true },
        { id: "r2", email: "maya@example.com", referred: 6, earnedCents: 3120, flagged: false },
      ]}
      payouts={[
        { id: "o1", email: "priya@example.com", amountCents: 14200, method: "upi", destination: "priya@okbank", status: "requested", note: null, createdAt: ago(5), flagged: true },
        { id: "o2", email: "maya@example.com", amountCents: 2600, method: "wise", destination: "maya@example.com", status: "paid", note: null, createdAt: ago(200), flagged: false },
      ]}
      tab={tab}
      modelNames={{ "nano-banana-2.1": "Nano Banana 2.1", "gemini-omni-flash": "Gemini Omni Flash" }}
      labs={[
        stat({ lab: "openrouter", has_balance: true, balance_micros: 18_400_000, recorded_at: ago(0), spent_since_micros: 0, spent_7d_micros: 9_100_000, first_job_at: ago(168), note: "Read live from OpenRouter" }),
        stat({ lab: "google", has_balance: true, balance_micros: 40_000_000, recorded_at: ago(72), spent_since_micros: 21_300_000, spent_7d_micros: 22_000_000, first_job_at: ago(240), note: "Topped up $40" }),
      ]}
      margins={[
        { model_key: "gemini-omni-flash", ok_jobs: 41, failed_jobs: 3, credits: 1107, lab_cost_micros: 32_800_000, actual_cost_jobs: 12, revenue_micros: 104_200_000, free_credits: 0 },
        { model_key: "nano-banana-2.1", ok_jobs: 212, failed_jobs: 4, credits: 424, lab_cost_micros: 7_123_200, actual_cost_jobs: 0, revenue_micros: 39_800_000, free_credits: 40 },
      ]}
      free={[
        { reason: "granted", count: 58 },
        { reason: "device_used", count: 9 },
        { reason: "disposable", count: 4 },
      ]}
      payments={[
        { currency: "USD", count: 6, total_minor: 24500 },
      ]}
      signups={{ total: 74, today: 3, week: 19, month: 71 }}
      users={[
        { id: "u1", email: "tara@example.com", country: "IN", created_at: ago(2), balance: 2, jobs: 0, paid: false },
        { id: "u2", email: "sam@example.com", country: "US", created_at: ago(30), balance: 118, jobs: 14, paid: true },
      ]}
      recentPayments={[{ email: "sam@example.com", credits: 150, total_minor: 1500, status: "paid", created_at: ago(30) }]}
    />
  );
}
