import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { DEVICE_COOKIE } from "@/config/free-tier";
import { claimFreeCredits } from "@/lib/free-tier";
import { announceSignup } from "@/lib/notify";
import { recordProfile } from "@/lib/profile";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

// Two ways in. The email link lands here with ?code=..., and the 6 digit code form sends people here
// with ?session=1 once it has signed them in. Both end the same way: offer free credits, then go to the app.
export async function GET(req: Request) {
  const url = new URL(req.url);
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
  track(user.id, "signed_in", { free_credits: free.outcome });
  await announceSignup(user, req.headers, free.outcome);
  const target = new URL(dest, url.origin);
  if (free.outcome !== "off") target.searchParams.set("welcome", free.outcome);
  const res = NextResponse.redirect(target);
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
