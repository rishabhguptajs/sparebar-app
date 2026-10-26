import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { DEVICE_COOKIE } from "@/config/free-tier";
import { claimFreeCredits } from "@/lib/free-tier";
import { REFERRAL_COOKIE } from "@/config/referral";
import { announceSignup } from "@/lib/notify";
import { recordProfile } from "@/lib/profile";
import { attachReferrer } from "@/lib/referral";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

// Two ways in. The email link lands here with ?code=..., and the 6 digit code form sends people here
// with ?session=1 once it has signed them in. Both end the same way: offer free credits, then go to the app.
export async function GET(req: Request) {
  const url = new URL(req.url);
  // Behind a tunnel in local dev, req.url shows the local address, so send people back to the public one.
  if (process.env.NODE_ENV !== "production") {
    const site = new URL(brand.url);
    url.protocol = site.protocol;
    url.hostname = site.hostname;
    url.port = site.port;
  }
  const code = url.searchParams.get("code");
  const dest = safeNext(url.searchParams.get("next"), url.origin);
  const supabase = await createClient();

  let user: User | null = null;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("sign-in code exchange failed", error.status, error.message);
    else user = data.user;
  } else if (url.searchParams.get("session")) {
    user = (await supabase.auth.getUser()).data.user;
  }
  if (!user) return NextResponse.redirect(new URL("/login?error=link", url.origin));

  await recordProfile(user, req.headers);

  // The email proves the address, so this is the moment to offer free credits.
  const free = await claimFreeCredits(user, req.headers);
  // A ?ref= link from earlier locks the referrer in, once, for a brand new account.
  const refCode = (await cookies()).get(REFERRAL_COOKIE)?.value ?? (user.user_metadata?.referral_code as string | undefined);
  const referral = refCode ? await attachReferrer(user.id, refCode) : null;
  track(user.id, "signed_in", { free_credits: free.outcome });
  if (referral === "attached") track(user.id, "referral_attached");
  await announceSignup(user, req.headers, free.outcome);
  const target = new URL(dest, url.origin);
  if (free.outcome !== "off") target.searchParams.set("welcome", free.outcome);
  const res = NextResponse.redirect(target);
  res.cookies.delete(REFERRAL_COOKIE);
  if (free.newDeviceId) {
    res.cookies.set(DEVICE_COOKIE, free.newDeviceId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 400, path: "/" });
  }
  return res;
}

// Resolve first, then compare origins: string checks miss tricks like "/\evil.com".
function safeNext(next: string | null, origin: string): string {
  if (!next) return "/app";
  try {
    const target = new URL(next, origin);
    if (target.origin !== origin) return "/app";
    // Collapse leading slashes so "//host" can never be read as a protocol-relative URL.
    return "/" + target.pathname.replace(/^\/+/, "") + target.search;
  } catch {
    return "/app";
  }
}
