import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { admin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

const Body = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// Called by the browser right after Checkout succeeds. The webhook does the same work,
// so whichever arrives first grants the credits and the other finds it already done.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;

  // Use the order id we stored for this user, never one taken from the browser alone.
  const { data: payment } = await admin()
    .from("payments")
    .select("razorpay_order_id")
    .eq("razorpay_order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (!verifyCheckoutSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const { data, error } = await admin().rpc("fulfill_payment", { p_order_id: orderId, p_payment_id: paymentId } as never);
  if (error) {
    console.error("fulfill failed", error);
    return NextResponse.json({ error: "Payment received but credits are delayed. They will appear shortly." }, { status: 500 });
  }
  const row = (data as { credits: number }[] | null)?.[0];
  return NextResponse.json({ ok: true, credits: row?.credits ?? 0 });
}
