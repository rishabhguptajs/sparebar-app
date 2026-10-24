// Plans and credit packs. USD prices are in cents. Each one needs a matching product in Dodo Payments
// at the same price (see DODO_PRODUCT_* in .env.example). Edit here to change what is sold.
// Keys also name the Dodo product env vars (DODO_PRODUCT_PACK_270 etc.), so they stay when credits change.
// Credit value: 1 credit = $0.10 at the base plan (see src/lib/credits.ts).

export type Product = {
  key: string;
  kind: "plan" | "pack";
  label: string;
  priceUsdCents: number;
  credits: number;
};

// Plans are paid month by month and renewed by buying again. Automatic renewal can be added once
// Dodo subscriptions are set up.
export const PLANS: Product[] = [
  { key: "starter", kind: "plan", label: "Starter", priceUsdCents: 1500, credits: 170 },
  { key: "creator", kind: "plan", label: "Creator", priceUsdCents: 3900, credits: 500 },
  { key: "studio", kind: "plan", label: "Studio", priceUsdCents: 9900, credits: 1300 },
];

export const PACKS: Product[] = [
  { key: "pack-100", kind: "pack", label: "110 credits", priceUsdCents: 1000, credits: 110 },
  { key: "pack-270", kind: "pack", label: "310 credits", priceUsdCents: 2500, credits: 310 },
  { key: "pack-560", kind: "pack", label: "640 credits", priceUsdCents: 5000, credits: 640 },
];

export const PRODUCTS = [...PLANS, ...PACKS];

export function getProduct(key: string) {
  return PRODUCTS.find((p) => p.key === key);
}

/** Dollars per credit, for display. */
export function perCredit(p: Product) {
  return p.priceUsdCents / 100 / p.credits;
}
