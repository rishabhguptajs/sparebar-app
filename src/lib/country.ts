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
