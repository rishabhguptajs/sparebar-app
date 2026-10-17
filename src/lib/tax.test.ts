import { describe, expect, it } from "vitest";
import { PACKS, PLANS, PRODUCTS, getProduct, perCredit } from "@/config/plans";
import { quote } from "./tax";

const starter = getProduct("starter")!;

describe("quote", () => {
  it("charges the USD price with no GST outside India", () => {
    expect(quote({ product: starter, inIndia: false })).toEqual({
      currency: "USD",
      baseMinor: 1500,
      gstMinor: 0,
      cgstMinor: 0,
      sgstMinor: 0,
      igstMinor: 0,
      totalMinor: 1500,
    });
  });

  it("adds 18% IGST for another state", () => {
    const q = quote({ product: starter, inIndia: true, stateCode: "29", inrPerUsd: 88, sellerStateCode: "27" });
    expect(q.baseMinor).toBe(132000); // 15.00 USD x 88 = 1320.00 INR
    expect(q.gstMinor).toBe(23760);
    expect(q.igstMinor).toBe(23760);
    expect(q.cgstMinor + q.sgstMinor).toBe(0);
    expect(q.totalMinor).toBe(155760);
  });

  it("splits into CGST and SGST in the seller's state", () => {
    const q = quote({ product: starter, inIndia: true, stateCode: "27", inrPerUsd: 88, sellerStateCode: "27" });
    expect(q.cgstMinor).toBe(11880);
    expect(q.sgstMinor).toBe(11880);
    expect(q.igstMinor).toBe(0);
  });

  it("keeps the parts equal to the whole when GST is an odd number of paise", () => {
    for (const p of PRODUCTS) {
      for (const rate of [83.17, 88.33, 91.01]) {
        const q = quote({ product: p, inIndia: true, stateCode: "27", inrPerUsd: rate, sellerStateCode: "27" });
        expect(q.cgstMinor + q.sgstMinor).toBe(q.gstMinor);
        expect(q.baseMinor + q.gstMinor).toBe(q.totalMinor);
      }
    }
  });

  it("refuses an Indian quote without a rate or a state", () => {
    expect(() => quote({ product: starter, inIndia: true, stateCode: "27" })).toThrow();
    expect(() => quote({ product: starter, inIndia: true, inrPerUsd: 88 })).toThrow();
  });
});

describe("catalog", () => {
  it("matches the brief", () => {
    expect(PLANS.map((p) => [p.priceUsdCents, p.credits])).toEqual([
      [1500, 150],
      [3900, 420],
      [9900, 1200],
    ]);
    expect(PACKS.map((p) => [p.priceUsdCents, p.credits])).toEqual([
      [1000, 100],
      [2500, 270],
      [5000, 560],
    ]);
  });

  it("gets cheaper per credit as the amount grows", () => {
    const rates = PLANS.map(perCredit);
    expect(rates[0]).toBeGreaterThan(rates[1]);
    expect(rates[1]).toBeGreaterThan(rates[2]);
  });

  it("has unique keys", () => {
    expect(new Set(PRODUCTS.map((p) => p.key)).size).toBe(PRODUCTS.length);
  });
});
