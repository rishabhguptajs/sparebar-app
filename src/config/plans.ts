// Plans and credit packs. Prices are in USD cents. Edit here to change what is sold.
// Credit value: 1 credit = $0.10 at the base plan (see src/lib/credits.ts).

export type Product = {
  key: string;
  kind: "plan" | "pack";
  label: string;
  priceUsdCents: number;
  credits: number;
};

// Plans are paid month by month and renewed by buying again. Automatic renewal can be added once
// Razorpay confirms that subscriptions work on international cards.
export const PLANS: Product[] = [
  { key: "starter", kind: "plan", label: "Starter", priceUsdCents: 1500, credits: 150 },
  { key: "creator", kind: "plan", label: "Creator", priceUsdCents: 3900, credits: 420 },
  { key: "studio", kind: "plan", label: "Studio", priceUsdCents: 9900, credits: 1200 },
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

export const GST_RATE_PERCENT = 18;

// GST state codes, used to choose between CGST plus SGST and IGST.
export const STATES: { code: string; name: string }[] = [
  ["01", "Jammu and Kashmir"],
  ["02", "Himachal Pradesh"],
  ["03", "Punjab"],
  ["04", "Chandigarh"],
  ["05", "Uttarakhand"],
  ["06", "Haryana"],
  ["07", "Delhi"],
  ["08", "Rajasthan"],
  ["09", "Uttar Pradesh"],
  ["10", "Bihar"],
  ["11", "Sikkim"],
  ["12", "Arunachal Pradesh"],
  ["13", "Nagaland"],
  ["14", "Manipur"],
  ["15", "Mizoram"],
  ["16", "Tripura"],
  ["17", "Meghalaya"],
  ["18", "Assam"],
  ["19", "West Bengal"],
  ["20", "Jharkhand"],
  ["21", "Odisha"],
  ["22", "Chhattisgarh"],
  ["23", "Madhya Pradesh"],
  ["24", "Gujarat"],
  ["26", "Dadra and Nagar Haveli and Daman and Diu"],
  ["27", "Maharashtra"],
  ["29", "Karnataka"],
  ["30", "Goa"],
  ["31", "Lakshadweep"],
  ["32", "Kerala"],
  ["33", "Tamil Nadu"],
  ["34", "Puducherry"],
  ["35", "Andaman and Nicobar Islands"],
  ["36", "Telangana"],
  ["37", "Andhra Pradesh"],
  ["38", "Ladakh"],
].map(([code, name]) => ({ code, name }));
