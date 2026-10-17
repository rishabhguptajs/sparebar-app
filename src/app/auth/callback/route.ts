import { NextResponse } from "next/server";
import { DEVICE_COOKIE } from "@/config/free-tier";
import { claimFreeCredits } from "@/lib/free-tier";
import { createClient } from "@/lib/supabase/server";

// Magic link lands here with ?code=...; exchange it for a session cookie.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const dest = safeNext(next, url.origin);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // The email link proves the address, so this is the moment to offer free credits.
      const free = data.user ? await claimFreeCredits(data.user, req.headers) : { outcome: "off" as const };
      const target = new URL(dest, url.origin);
      if (free.outcome !== "off") target.searchParams.set("welcome", free.outcome);
      const res = NextResponse.redirect(target);
      if (free.newDeviceId) {
        res.cookies.set(DEVICE_COOKIE, free.newDeviceId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 400, path: "/" });
      }
      return res;
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
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
