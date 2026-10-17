import { CREDIT_VALUE_MICROS } from "@/lib/credits";

export type MarginRow = {
  model_key: string;
  ok_jobs: number;
  failed_jobs: number;
  credits: number;
  lab_cost_micros: number;
  actual_cost_jobs: number;
};

/** Target share of the credit price that is margin: lab cost is 30% of retail, so 70%. */
export const TARGET_MARGIN = 0.7;

export function marginFor(row: MarginRow) {
  const revenue = row.credits * CREDIT_VALUE_MICROS; // credits at the base $0.10 each
  const margin = revenue > 0 ? 1 - row.lab_cost_micros / revenue : null;
  return {
    revenueMicros: revenue,
    profitMicros: revenue - row.lab_cost_micros,
    margin,
    belowTarget: margin !== null && margin < TARGET_MARGIN - 1e-9,
    avgCostMicros: row.ok_jobs > 0 ? Math.round(row.lab_cost_micros / row.ok_jobs) : null,
    failRate: row.ok_jobs + row.failed_jobs > 0 ? row.failed_jobs / (row.ok_jobs + row.failed_jobs) : null,
  };
}
