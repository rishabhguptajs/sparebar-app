import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Magic link lands here with ?code=...; exchange it for a session cookie.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const dest = safeNext(next, url.origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(dest, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}

// Resolve first, then compare origins: string checks miss tricks like "/\evil.com".
function safeNext(next: string | null, origin: string): string {
  if (!next) return "/app";
  try {
    const target = new URL(next, origin);
    return target.origin === origin ? target.pathname + target.search : "/app";
  } catch {
    return "/app";
  }
}
