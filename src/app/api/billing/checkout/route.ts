import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { brand } from "@/config/brand";
import { getProduct } from "@/config/plans";
import { createCheckout, createDiscount } from "@/lib/dodo";
import { env } from "@/lib/env";
import { eligibleForFriendDiscount } from "@/lib/referral";
import { discountedCents, newReferralCode } from "@/lib/referral-code";
import { REFERRAL } from "@/config/referral";
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
    const productId = env.dodoProductId(product.key);
    // A referred friend's first purchase gets the friend discount, through a one-use code for this product only.
    let discountCode: string | undefined;
    if (await eligibleForFriendDiscount(user.id)) {
      discountCode = `REF${newReferralCode()}`;
      await createDiscount({ code: discountCode, productId, basisPoints: REFERRAL.friendDiscountBp, expiresAt: new Date(Date.now() + 86_400_000) });
    }
    const payCents = discountCode ? discountedCents(product.priceUsdCents) : product.priceUsdCents;
    const session = await createCheckout({
      productId,
      discountCode,
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
        base_minor: payCents,
        total_minor: payCents,
        discount_code: discountCode ?? null,
        discount_cents: product.priceUsdCents - payCents,
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
