// Single source for name and domain. Moving to a .com or .ai later is a change here plus a redirect.
export const brand = {
  name: "Sparebar",
  domain: "sparebar.xyz",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sparebar.xyz",
  supportEmail: "support@sparebar.xyz",
  // Who operates the service. No company is registered yet, so this is an individual.
  // When a company exists, change legalName and set kind to "company".
  company: {
    legalName: "Rishabh Gupta",
    kind: "individual" as "individual" | "company",
    country: "India",
  },
} as const;
