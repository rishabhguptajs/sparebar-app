import { describe, expect, it } from "vitest";
import { PayoutDetails, destinationOf } from "./payout-details";

const bank = { method: "bank", holder: "Priya Sharma", accountNumber: "123456789012", ifsc: "hdfc0001234" };

describe("payout details", () => {
  it("accepts a bank account and upper-cases the IFSC", () => {
    const d = PayoutDetails.parse(bank);
    expect(d.method === "bank" && d.ifsc).toBe("HDFC0001234");
    expect(destinationOf(d)).toBe("Priya Sharma | A/C 123456789012 | IFSC HDFC0001234");
  });

  it("rejects bad bank details", () => {
    expect(PayoutDetails.safeParse({ ...bank, accountNumber: "12345" }).success).toBe(false);
    expect(PayoutDetails.safeParse({ ...bank, accountNumber: "12345678901a" }).success).toBe(false);
    expect(PayoutDetails.safeParse({ ...bank, ifsc: "HDFC1001234" }).success).toBe(false);
    expect(PayoutDetails.safeParse({ ...bank, holder: " " }).success).toBe(false);
  });

  it("checks UPI IDs and Wise emails", () => {
    expect(PayoutDetails.safeParse({ method: "upi", upiId: "priya.s@okhdfcbank" }).success).toBe(true);
    expect(PayoutDetails.safeParse({ method: "upi", upiId: "9876543210" }).success).toBe(false);
    expect(PayoutDetails.safeParse({ method: "wise", email: "a@b.co" }).success).toBe(true);
    expect(PayoutDetails.safeParse({ method: "wise", email: "nope" }).success).toBe(false);
  });

  it("needs nothing for credits", () => {
    expect(destinationOf(PayoutDetails.parse({ method: "credits" }))).toBe("");
  });
});
