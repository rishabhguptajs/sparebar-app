import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { brand } from "@/config/brand";
import { getProduct } from "@/config/plans";
import { createCheckout } from "@/lib/dodo";
import { env } from "@/lib/env";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

const Body = z.object({ productKey: z.string().min(1) });

// Dodo is the merchant of record: it shows the price, collects tax and sends the receipt.
// We only record the purchase and grant the credits when its webhook says the payment succeeded.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Sign in to buy credits." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const product = getProduct(parsed.data.productKey);
  if (!product) return NextResponse.json({ error: "That product is not available." }, { status: 404 });

  try {
    const id = randomUUID();
    const name = user.email.split("@")[0];
    const session = await createCheckout({
      productId: env.dodoProductId(product.key),
      email: user.email,
      name,
      returnUrl: `${brand.url}/app/credits?checkout=return`,
      metadata: { user_id: user.id, product: product.key, payment_id: id },
    });

    const { error } = await admin()
      .from("payments")
      .insert({
        id,
        user_id: user.id,
        product_key: product.key,
        kind: product.kind,
        credits: product.credits,
        list_usd_cents: product.priceUsdCents,
        currency: "USD",
        base_minor: product.priceUsdCents,
        total_minor: product.priceUsdCents,
        customer_name: name,
        customer_email: user.email,
        checkout_session_id: session.session_id,
      } as never);
    if (error) throw error;

    return NextResponse.json({ url: session.checkout_url });
  } catch (e) {
    console.error("create checkout failed", e);
    return NextResponse.json({ error: "Could not start the payment. Try again in a moment." }, { status: 502 });
  }
}
