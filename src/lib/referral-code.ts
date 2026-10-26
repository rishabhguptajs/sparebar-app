import { randomBytes } from "node:crypto";
import { CODE_ALPHABET, CODE_LENGTH, REFERRAL } from "@/config/referral";

export function newReferralCode() {
  const bytes = randomBytes(CODE_LENGTH);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** Price after the friend discount, in cents. Rounds the way a percentage off usually does. */
export function discountedCents(priceCents: number) {
  return priceCents - Math.round((priceCents * REFERRAL.friendDiscountBp) / 10000);
}
