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
  razorpayKeyId: () => need("RAZORPAY_KEY_ID"),
  razorpayKeySecret: () => need("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: () => need("RAZORPAY_WEBHOOK_SECRET"),
  /** GST state code of the seller, for the CGST/SGST versus IGST split. */
  sellerStateCode: () => process.env.SELLER_STATE_CODE || undefined,
};
