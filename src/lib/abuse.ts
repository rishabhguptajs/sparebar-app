import { createHmac } from "node:crypto";

// A short list of well known throwaway mail domains. It stops casual abuse, not a determined person.
const DISPOSABLE = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "fakeinbox.com",
  "mintemail.com",
  "mohmal.com",
  "emailondeck.com",
]);

/**
 * One canonical form per mailbox, so aliases count as the same person.
 * Lowercases, drops +tags, and for Gmail also drops dots in the name.
 */
export function normalizeEmail(email: string): string {
  const [local = "", domainRaw = ""] = email.trim().toLowerCase().split("@");
  const domain = domainRaw === "googlemail.com" ? "gmail.com" : domainRaw;
  let name = local.split("+")[0];
  if (domain === "gmail.com") name = name.replace(/\./g, "");
  return `${name}@${domain}`;
}

export function isDisposable(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return DISPOSABLE.has(domain);
}

/** Keyed hash, so stored values cannot be turned back into a cookie or an address. */
export function hashValue(salt: string, value: string): string {
  return createHmac("sha256", salt).update(value).digest("hex");
}

/** Client address as seen by the platform proxy. Takes the first entry of x-forwarded-for. */
export function clientIp(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip") || null;
}
