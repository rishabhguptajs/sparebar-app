import { describe, expect, it } from "vitest";
import {
  MODELS,
  currentPrice,
  getModel,
  type ModelConfig,
} from "@/config/models";
import { creditsForCost, creditsForModel } from "./credits";

describe("credits", () => {
  it("matches the launch catalog", () => {
    const expected: Record<string, number> = {
      "nano-banana-2.1": 2,
      "nano-banana-pro": 5,
      "nano-banana-2": 3,
      "nano-banana": 2,
      "nano-banana-2-lite": 2,
      "grok-imagine-image": 2,
      "seedream-5-pro": 2,
      "flux-3-image": 2,
      "qwen-image-3": 1,
      "gemini-omni-flash": 27,
      "veo-3.1": 107,
      "veo-3.1-fast": 27,
      "veo-3.1-lite": 14,
      "seedance-2.0": 41,
      "seedance-2.0-fast": 25,
      "seedance-2.0-mini": 21,
      "seedance-2.5": 62,
      "seedance-1.5-pro": 14,
      "kling-v3-std": 34,
      "kling-v3-pro": 45,
      "wan-3.0": 27,
      "wan-3.0-prime": 38,
      "happyhorse-1.1": 27,
      "grok-imagine-video-1.5-lite": 8,
      "grok-imagine-video": 19,
      "grok-imagine-video-1.5": 38,
      "hailuo-3": 35,
      "hailuo-3-max": 22,
      "runway-gen-4.5": 32,
      "flux-3-video": 46,
      "heygen-video": 10,
      "heygen-avatar-iv": 14,
    };
    for (const m of MODELS) {
      expect([m.key, creditsForModel(m)]).toEqual([m.key, expected[m.key]]);
    }
    expect(Object.keys(expected).sort()).toEqual(
      MODELS.map((m) => m.key).sort(),
    );
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
    expect(currentPrice(m, new Date("2026-11-30T23:59:59Z")).costMicros).toBe(
      33_600,
    );
    expect(currentPrice(m, new Date("2026-12-01T00:00:00Z")).costMicros).toBe(
      60_000,
    );
  });
});
