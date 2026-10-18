// Country of a request, from the headers the host adds. Vercel and Cloudflare both do this.
const HEADERS = ["x-vercel-ip-country", "cf-ipcountry", "cloudfront-viewer-country"];

export function countryFromHeaders(h: Headers): string | null {
  for (const raw of HEADERS.map((n) => h.get(n))) {
    const c = raw?.trim().toUpperCase();
    // XX and T1 are Cloudflare's "unknown" and "Tor".
    if (c && /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1") return c;
  }
  return null;
}

/** Payment region for a country. Anything that is not India is outside India. */
export function isIndia(country: string | null | undefined) {
  return country === "IN";
}

/** Payment region for display: India for Indian visitors, otherwise outside India. */
export function regionOf(country: string | null | undefined): "IN" | "OTHER" {
  return isIndia(country) ? "IN" : "OTHER";
}
