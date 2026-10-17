import { currentPrice, type ModelConfig } from "@/config/models";

/** Retail value of one credit at the base plan, in micro-USD ($0.10). */
export const CREDIT_VALUE_MICROS = 100_000;
/** Share of retail that lab cost may use. 0.30 gives a 70% margin on lab cost. */
export const LAB_COST_SHARE = 0.3;

/** Lab cost covered by one credit: 0.30 * $0.10 = $0.03. Kept integer. */
const MICROS_PER_CREDIT = Math.round(CREDIT_VALUE_MICROS * LAB_COST_SHARE);

/** credits = ceil(lab cost / 0.30 / 0.10), computed in integers. Minimum 1. */
export function creditsForCost(costMicros: number): number {
  if (!Number.isInteger(costMicros) || costMicros < 0) {
    throw new Error(`costMicros must be a non-negative integer, got ${costMicros}`);
  }
  return Math.max(1, Math.ceil(costMicros / MICROS_PER_CREDIT));
}

export function creditsForModel(model: ModelConfig, at: Date = new Date()): number {
  return creditsForCost(currentPrice(model, at).costMicros);
}
