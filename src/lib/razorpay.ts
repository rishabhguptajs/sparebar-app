import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

/** Create an order. A new order is needed for every payment attempt. */
export async function createOrder(input: {
  amount: number;
  currency: "USD" | "INR";
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${env.razorpayKeyId()}:${env.razorpayKeySecret()}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.description ?? `Razorpay ${res.status}`;
    throw new Error(`Razorpay order failed: ${msg}`);
  }
  return body as RazorpayOrder;
}

function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout success: HMAC SHA256 of "order_id|payment_id" with the API key secret. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", env.razorpayKeySecret()).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook: HMAC SHA256 of the raw request body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const expected = createHmac("sha256", env.razorpayWebhookSecret()).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
