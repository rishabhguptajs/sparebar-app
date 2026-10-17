import { describe, expect, it } from "vitest";
import { MODELS, currentPrice, getModel, type ModelConfig } from "@/config/models";
import { creditsForCost, creditsForModel } from "./credits";

describe("credits", () => {
  it("matches the launch catalog", () => {
    const expected: Record<string, number> = {
      "nano-banana-2.1": 2,
      "grok-imagine-image": 2,
      "nano-banana-pro": 5,
      "grok-imagine-video-1.5-lite": 8,
      "grok-imagine-video": 19,
      "minimax-h3": 22,
      "gemini-omni-flash": 27,
      "wan-3.0": 27,
      "grok-imagine-video-1.5": 38,
    };
    for (const m of MODELS) {
      expect([m.key, creditsForModel(m)]).toEqual([m.key, expected[m.key]]);
    }
    expect(Object.keys(expected).sort()).toEqual(MODELS.map((m) => m.key).sort());
  });

  it("rounds up at the boundary without float drift", () => {
    expect(creditsForCost(240_000)).toBe(8); // exactly 8 credits of lab cost
    expect(creditsForCost(240_001)).toBe(9);
    expect(creditsForCost(0)).toBe(1);
  });

  it("picks the price in force by date", () => {
    const base = getModel("nano-banana-2.1")!;
    const m: ModelConfig = {
      ...base,
      prices: [
        { effectiveFrom: "2026-01-01", costMicros: 33_600 },
        { effectiveFrom: "2026-12-01", costMicros: 60_000 },
      ],
    };
    expect(currentPrice(m, new Date("2026-11-30T23:59:59Z")).costMicros).toBe(33_600);
    expect(currentPrice(m, new Date("2026-12-01T00:00:00Z")).costMicros).toBe(60_000);
  });
});
