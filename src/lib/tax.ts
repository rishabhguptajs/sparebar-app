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
  /** Rupees per US dollar. Needed for India. */
  inrPerUsd?: number;
  /** GST state code of the seller. */
  sellerStateCode?: string;
};

/**
 * Price for one purchase, in cents (outside India) or paise (India).
 * Outside India: USD, no GST, treated as an export of services.
 * India: the USD price converted at inrPerUsd, plus 18% GST. Same state as the seller splits
 * the tax into CGST and SGST, any other state is IGST.
 */
export function quote({ product, inIndia, stateCode, inrPerUsd, sellerStateCode }: Input): Quote {
  if (!inIndia) {
    const base = product.priceUsdCents;
    return { currency: "USD", baseMinor: base, gstMinor: 0, cgstMinor: 0, sgstMinor: 0, igstMinor: 0, totalMinor: base };
  }
  if (!inrPerUsd || inrPerUsd <= 0) throw new Error("Rupee pricing is not configured.");
  if (!stateCode) throw new Error("State is required for payments from India.");

  // cents times rupees per dollar is paise
  const baseMinor = Math.round(product.priceUsdCents * inrPerUsd);
  const gstMinor = Math.round((baseMinor * GST_RATE_PERCENT) / 100);
  const sameState = !!sellerStateCode && stateCode === sellerStateCode;
  const cgstMinor = sameState ? Math.floor(gstMinor / 2) : 0;
  const sgstMinor = sameState ? gstMinor - cgstMinor : 0;
  const igstMinor = sameState ? 0 : gstMinor;
  return { currency: "INR", baseMinor, gstMinor, cgstMinor, sgstMinor, igstMinor, totalMinor: baseMinor + gstMinor };
}

export function formatMoney(minor: number, currency: "USD" | "INR") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency }).format(minor / 100);
}
