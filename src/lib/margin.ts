import { MODELS } from "@/config/models";

export type MarginRow = {
  model_key: string;
  ok_jobs: number;
  failed_jobs: number;
  credits: number;
  lab_cost_micros: number;
  actual_cost_jobs: number;
  /** What buyers paid for the credits these jobs used, from the grant each job drew from. */
  revenue_micros: number;
  /** Credits that earned nothing: free signup credits and admin grants. */
  free_credits: number;
};

/** OpenRouter adds this to every top-up, so a dollar of lab cost really costs more. */
export const OPENROUTER_TOPUP_FEE = 0.055;

/**
 * Estimated payment processing share of revenue. Dodo charges 4% plus 40 cents per sale, plus 1.5% on cards from outside
 * the US, so 5.5% plus 40 cents. The 40 cents is about 1.5% on an average sale of $25, which makes roughly 7%.
 * Small packs cost more than that and big plans less. Check dodopayments.com/pricing if the rates change.
 */
export const PAYMENT_FEE_RATE = 0.07;

/** Margin after lab cost, the OpenRouter fee and the estimated payment fee. */
export const TARGET_MARGIN = 0.5;

const labByModel = new Map<string, string>(MODELS.map((m) => [m.key, m.lab]));

export function marginFor(row: MarginRow) {
  const revenue = row.revenue_micros;
  const labCost = row.lab_cost_micros;
  const topUpFee = labByModel.get(row.model_key) === "openrouter" ? Math.round(labCost * OPENROUTER_TOPUP_FEE) : 0;
  const paymentFee = Math.round(revenue * PAYMENT_FEE_RATE);
  const cost = labCost + topUpFee + paymentFee;
  const margin = revenue > 0 ? 1 - cost / revenue : null;
  return {
    revenueMicros: revenue,
    costMicros: cost,
    topUpFeeMicros: topUpFee,
    paymentFeeMicros: paymentFee,
    profitMicros: revenue - cost,
    margin,
    belowTarget: margin !== null && margin < TARGET_MARGIN - 1e-9,
    avgCostMicros: row.ok_jobs > 0 ? Math.round(labCost / row.ok_jobs) : null,
    failRate: row.ok_jobs + row.failed_jobs > 0 ? row.failed_jobs / (row.ok_jobs + row.failed_jobs) : null,
  };
}
