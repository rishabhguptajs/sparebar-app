import { AdminView } from "@/components/admin-view";
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

export default function PreviewAdmin() {
  return (
    <AdminView
      base="/preview"
      demo
      days={30}
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
        { currency: "INR", count: 3, total_minor: 1245000 },
      ]}
    />
  );
}
