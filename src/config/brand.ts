// Single source for name and domain. Moving to a .com or .ai later is a change here plus a redirect.
export const brand = {
  name: "Sparebar",
  domain: "sparebar.xyz",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sparebar.xyz",
  supportEmail: "support@sparebar.xyz",
  company: {
    legalName: "Raegent Private Limited",
    site: "https://raegent.com",
    country: "India",
  },
} as const;
