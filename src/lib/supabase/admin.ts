import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: ReturnType<typeof createClient> | undefined;

/** Service role client. Bypasses RLS: server code only, never send to the browser. */
export function admin() {
  client ??= createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
