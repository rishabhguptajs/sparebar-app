import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, CODE_LENGTH } from "@/config/referral";
import { discountedCents, newReferralCode } from "./referral-code";

describe("referral codes", () => {
  it("makes codes of the right length with no look-alike characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = newReferralCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect([...code].every((c) => CODE_ALPHABET.includes(c))).toBe(true);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it("does not repeat in a small sample", () => {
    expect(new Set(Array.from({ length: 500 }, newReferralCode)).size).toBe(500);
  });
});

describe("friend discount", () => {
  it("takes 15% off every product price", () => {
    expect(discountedCents(1500)).toBe(1275);
    expect(discountedCents(3900)).toBe(3315);
    expect(discountedCents(9900)).toBe(8415);
    expect(discountedCents(1000)).toBe(850);
    expect(discountedCents(2500)).toBe(2125);
    expect(discountedCents(5000)).toBe(4250);
  });
});
