import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEVICE_COOKIE } from "@/config/free-tier";

// Refreshes the Supabase session cookie on each request and guards /app.
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  // Mark this browser as one device, so a free grant can be limited to one per device.
  const newDevice = req.cookies.get(DEVICE_COOKIE) ? null : crypto.randomUUID();
  const withDevice = (r: NextResponse) => {
    if (newDevice) r.cookies.set(DEVICE_COOKIE, newDevice, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 400, path: "/" });
    return r;
  };
  // Before Supabase is configured, let pages render so the UI can be previewed.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return withDevice(res);
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();

  if (!data.user && req.nextUrl.pathname.startsWith("/app")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return withDevice(NextResponse.redirect(url));
  }
  return withDevice(res);
}

export const config = {
  matcher: ["/", "/app/:path*", "/login", "/api/generate", "/api/jobs/:path*"],
};
