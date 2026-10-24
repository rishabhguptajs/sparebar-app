import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const BASE = { test: "https://test.dodopayments.com", live: "https://live.dodopayments.com" } as const;

type Checkout = { session_id: string; checkout_url: string | null };

/** Create a hosted checkout session for one product. A new session is needed for every payment attempt. */
export async function createCheckout(input: {
  productId: string;
  email: string;
  name: string;
  returnUrl: string;
  metadata: Record<string, string>;
}): Promise<Checkout & { checkout_url: string }> {
  const res = await fetch(`${BASE[env.dodoMode()]}/checkouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.dodoApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_cart: [{ product_id: input.productId, quantity: 1 }],
      customer: { email: input.email, name: input.name },
      return_url: input.returnUrl,
      metadata: input.metadata,
    }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.checkout_url) {
    throw new Error(`Dodo checkout failed: ${body?.message ?? res.status}`);
  }
  return body as Checkout & { checkout_url: string };
}

/** Standard Webhooks: HMAC SHA256 of "id.timestamp.body" with the base64 key behind the whsec_ secret. */
export function verifyWebhook(rawBody: string, headers: Headers) {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatures = headers.get("webhook-signature");
  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = Buffer.from(env.dodoWebhookKey().replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();
  return signatures.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
