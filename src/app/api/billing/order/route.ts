import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { STATES, getProduct } from "@/config/plans";
import { env } from "@/lib/env";
import { createOrder } from "@/lib/razorpay";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { quote } from "@/lib/tax";

const Body = z.object({
  productKey: z.string().min(1),
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  // Razorpay needs a real phone number on international payments.
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,16}$/, "Enter a valid phone number."),
  inIndia: z.boolean(),
  stateCode: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Sign in to buy credits." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { productKey, name, phone, inIndia, stateCode } = parsed.data;

  const product = getProduct(productKey);
  if (!product) return NextResponse.json({ error: "That product is not available." }, { status: 404 });
  if (inIndia && !STATES.some((s) => s.code === stateCode)) {
    return NextResponse.json({ error: "Choose your state." }, { status: 400 });
  }

  try {
    const q = quote({
      product,
      inIndia,
      stateCode,
      sellerStateCode: env.sellerStateCode(),
    });

    const id = randomUUID();
    const order = await createOrder({
      amount: q.totalMinor,
      currency: q.currency,
      receipt: id,
      notes: { user_id: user.id, product: product.key, payment_id: id },
    });

    const { error } = await admin()
      .from("payments")
      .insert({
        id,
        user_id: user.id,
        product_key: product.key,
        kind: product.kind,
        credits: product.credits,
        currency: q.currency,
        base_minor: q.baseMinor,
        gst_minor: q.gstMinor,
        cgst_minor: q.cgstMinor,
        sgst_minor: q.sgstMinor,
        igst_minor: q.igstMinor,
        total_minor: q.totalMinor,
        customer_name: name,
        customer_email: user.email,
        customer_phone: phone,
        in_india: inIndia,
        state_code: inIndia ? stateCode : null,
        razorpay_order_id: order.id,
      } as never);
    if (error) throw error;

    return NextResponse.json({
      keyId: env.razorpayKeyId(),
      orderId: order.id,
      amount: q.totalMinor,
      currency: q.currency,
      description: `${product.label}, ${product.credits} credits`,
      prefill: { name, email: user.email, contact: phone },
    });
  } catch (e) {
    console.error("create order failed", e);
    return NextResponse.json({ error: "Could not start the payment. Try again in a moment." }, { status: 502 });
  }
}
