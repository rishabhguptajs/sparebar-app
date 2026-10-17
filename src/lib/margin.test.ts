import { describe, expect, it } from "vitest";
import { MODELS, currentPrice } from "@/config/models";
import { creditsForModel } from "@/lib/credits";
import { marginFor, TARGET_MARGIN } from "./margin";

const row = (credits: number, cost: number, ok = 1, failed = 0) => ({
  model_key: "m",
  ok_jobs: ok,
  failed_jobs: failed,
  credits,
  lab_cost_micros: cost,
  actual_cost_jobs: 0,
});

describe("marginFor", () => {
  it("computes margin against $0.10 per credit", () => {
    const m = marginFor(row(2, 33_600));
    expect(m.revenueMicros).toBe(200_000);
    expect(m.margin).toBeCloseTo(0.832, 3);
    expect(m.belowTarget).toBe(false);
  });

  it("flags a model that costs more than 30% of its credit price", () => {
    expect(marginFor(row(27, 1_200_000)).belowTarget).toBe(true);
  });

  it("reports average cost and failure rate", () => {
    const m = marginFor(row(10, 300_000, 4, 1));
    expect(m.avgCostMicros).toBe(75_000);
    expect(m.failRate).toBeCloseTo(0.2);
  });

  it("handles no data", () => {
    const m = marginFor(row(0, 0, 0, 0));
    expect(m.margin).toBeNull();
    expect(m.avgCostMicros).toBeNull();
  });

  it("every catalog model meets the target at its listed price", () => {
    for (const model of MODELS) {
      const credits = creditsForModel(model);
      const m = marginFor(row(credits, currentPrice(model).costMicros));
      expect(m.margin).toBeGreaterThanOrEqual(TARGET_MARGIN);
    }
  });
});
