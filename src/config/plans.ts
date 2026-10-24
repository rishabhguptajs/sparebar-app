// Plans and credit packs. USD prices are in cents. Each one needs a matching product in Dodo Payments
// at the same price (see DODO_PRODUCT_* in .env.example). Edit here to change what is sold.
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
  { key: "starter", kind: "plan", label: "Starter", priceUsdCents: 1500, credits: 150 },
  { key: "creator", kind: "plan", label: "Creator", priceUsdCents: 3900, credits: 420 },
  { key: "studio", kind: "plan", label: "Studio", priceUsdCents: 9900, credits: 1100 },
];

export const PACKS: Product[] = [
  { key: "pack-100", kind: "pack", label: "100 credits", priceUsdCents: 1000, credits: 100 },
  { key: "pack-270", kind: "pack", label: "270 credits", priceUsdCents: 2500, credits: 270 },
  { key: "pack-560", kind: "pack", label: "560 credits", priceUsdCents: 5000, credits: 560 },
];

export const PRODUCTS = [...PLANS, ...PACKS];

export function getProduct(key: string) {
  return PRODUCTS.find((p) => p.key === key);
}

/** Dollars per credit, for display. */
export function perCredit(p: Product) {
  return p.priceUsdCents / 100 / p.credits;
}
