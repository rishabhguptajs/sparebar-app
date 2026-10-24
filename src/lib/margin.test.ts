import { describe, expect, it } from "vitest";
import { MODELS, currentPrice } from "@/config/models";
import { PLANS } from "@/config/plans";
import { creditsForModel } from "@/lib/credits";
import { marginFor, OPENROUTER_TOPUP_FEE, PAYMENT_FEE_RATE, TARGET_MARGIN } from "./margin";

const OR = MODELS.find((m) => m.lab === "openrouter")!.key;
const GOOGLE = MODELS.find((m) => m.lab === "google")!.key;

const row = (revenue: number, cost: number, ok = 1, failed = 0, key = GOOGLE, free = 0) => ({
  model_key: key,
  ok_jobs: ok,
  failed_jobs: failed,
  credits: Math.round(revenue / 100_000),
  lab_cost_micros: cost,
  actual_cost_jobs: 0,
  revenue_micros: revenue,
  free_credits: free,
});

describe("marginFor", () => {
  it("takes the payment fee out of revenue on a direct lab", () => {
    const m = marginFor(row(200_000, 33_600));
    expect(m.topUpFeeMicros).toBe(0);
    expect(m.paymentFeeMicros).toBe(Math.round(200_000 * PAYMENT_FEE_RATE));
    expect(m.margin).toBeCloseTo(1 - (33_600 + 200_000 * PAYMENT_FEE_RATE) / 200_000, 3);
    expect(m.belowTarget).toBe(false);
  });

  it("adds the OpenRouter top-up fee to OpenRouter models only", () => {
    const viaOr = marginFor(row(200_000, 60_000, 1, 0, OR));
    const direct = marginFor(row(200_000, 60_000, 1, 0, GOOGLE));
    expect(viaOr.topUpFeeMicros).toBe(Math.round(60_000 * OPENROUTER_TOPUP_FEE));
    expect(direct.topUpFeeMicros).toBe(0);
    expect(viaOr.margin!).toBeLessThan(direct.margin!);
  });

  it("uses the price actually paid, so a cheaper credit lowers the margin", () => {
    const starter = marginFor(row(10 * 100_000, 300_000, 1, 0, OR));
    const studio = marginFor(row(10 * 90_000, 300_000, 1, 0, OR));
    expect(studio.margin!).toBeLessThan(starter.margin!);
  });

  it("flags a model whose cost is too high for what was paid", () => {
    expect(marginFor(row(2_700_000, 1_200_000, 1, 0, OR)).belowTarget).toBe(true);
  });

  it("reports average cost and failure rate", () => {
    const m = marginFor(row(1_000_000, 300_000, 4, 1));
    expect(m.avgCostMicros).toBe(75_000);
    expect(m.failRate).toBeCloseTo(0.2);
  });

  it("shows no margin when only free credits were used", () => {
    const m = marginFor(row(0, 50_000, 2, 0, OR, 10));
    expect(m.margin).toBeNull();
    expect(m.profitMicros).toBeLessThan(0);
  });

  it("handles no data", () => {
    const m = marginFor(row(0, 0, 0, 0));
    expect(m.margin).toBeNull();
    expect(m.avgCostMicros).toBeNull();
  });

  it("every catalog model meets the target at the base $0.10 credit", () => {
    for (const model of MODELS) {
      const credits = creditsForModel(model);
      const m = marginFor({ ...row(credits * 100_000, currentPrice(model).costMicros, 1, 0, model.key), credits });
      expect(m.margin).toBeGreaterThanOrEqual(TARGET_MARGIN);
    }
  });

  it("every plan still meets the target on a typical OpenRouter model", () => {
    for (const p of PLANS) {
      const perCredit = Math.round((p.priceUsdCents * 10_000) / p.credits);
      const m = marginFor(row(100 * perCredit, 100 * 30_000, 1, 0, OR));
      expect(m.margin).toBeGreaterThanOrEqual(TARGET_MARGIN);
    }
  });
});
