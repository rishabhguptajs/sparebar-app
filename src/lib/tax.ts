import { GST_RATE_PERCENT, type Product } from "@/config/plans";

export type Quote = {
  currency: "USD" | "INR";
  baseMinor: number;
  gstMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  totalMinor: number;
};

type Input = {
  product: Product;
  inIndia: boolean;
  /** GST state code of the buyer. Needed for India. */
  stateCode?: string;
  /** Whether the seller is registered for GST. Without it no GST can be charged. */
  gstRegistered?: boolean;
  /** GST state code of the seller. */
  sellerStateCode?: string;
};

/**
 * Price for one purchase, in cents (outside India) or paise (India).
 * Outside India: USD, no GST, treated as an export of services.
 * India: the fixed rupee price of the product, plus 18% GST when the seller is GST registered. Same state as the seller splits
 * the tax into CGST and SGST, any other state is IGST.
 */
export function quote({ product, inIndia, stateCode, sellerStateCode, gstRegistered = true }: Input): Quote {
  if (!inIndia) {
    const base = product.priceUsdCents;
    return { currency: "USD", baseMinor: base, gstMinor: 0, cgstMinor: 0, sgstMinor: 0, igstMinor: 0, totalMinor: base };
  }
  if (!stateCode) throw new Error("State is required for payments from India.");

  const baseMinor = product.priceInr * 100; // paise
  const gstMinor = gstRegistered ? Math.round((baseMinor * GST_RATE_PERCENT) / 100) : 0;
  const sameState = !!sellerStateCode && stateCode === sellerStateCode;
  const cgstMinor = sameState ? Math.floor(gstMinor / 2) : 0;
  const sgstMinor = sameState ? gstMinor - cgstMinor : 0;
  const igstMinor = sameState ? 0 : gstMinor;
  return { currency: "INR", baseMinor, gstMinor, cgstMinor, sgstMinor, igstMinor, totalMinor: baseMinor + gstMinor };
}

export function formatMoney(minor: number, currency: "USD" | "INR") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency }).format(minor / 100);
}
