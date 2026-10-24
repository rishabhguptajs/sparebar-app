// Server-only env access with clear errors when a key is missing.
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. See .env.example.`);
  return v;
}

export const env = {
  supabaseUrl: () => need("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => need("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => need("SUPABASE_SERVICE_ROLE_KEY"),
  r2AccountId: () => need("R2_ACCOUNT_ID"),
  r2AccessKeyId: () => need("R2_ACCESS_KEY_ID"),
  r2SecretAccessKey: () => need("R2_SECRET_ACCESS_KEY"),
  r2Bucket: () => need("R2_BUCKET"),
  cronSecret: () => need("CRON_SECRET"),
  dodoApiKey: () => need("DODO_PAYMENTS_API_KEY"),
  dodoWebhookKey: () => need("DODO_PAYMENTS_WEBHOOK_KEY"),
  /** "test" while using Dodo test keys, "live" in production. */
  dodoMode: () => (process.env.DODO_PAYMENTS_MODE === "live" ? ("live" as const) : ("test" as const)),
  /** Dodo product id for a plan or pack, for example DODO_PRODUCT_PACK_100. */
  dodoProductId: (key: string) => need(`DODO_PRODUCT_${key.toUpperCase().replace(/-/g, "_")}`),
};
