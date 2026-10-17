import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { admin } from "@/lib/supabase/admin";

type Event = {
  event: string;
  payload?: {
    payment?: { entity?: { id: string; order_id?: string } };
    refund?: { entity?: { payment_id?: string } };
  };
};

// Razorpay webhook. Set it to send payment.captured, payment.failed and refund.processed.
// Duplicate deliveries are expected: every action below is safe to repeat.
export async function POST(req: Request) {
  const raw = await req.text(); // the signature covers the raw body, so do not parse it first
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: Event;
  try {
    event = JSON.parse(raw) as Event;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const db = admin();
  const payment = event.payload?.payment?.entity;

  try {
    switch (event.event) {
      case "payment.captured":
      case "order.paid": {
        if (payment?.order_id) {
          const { error } = await db.rpc("fulfill_payment", { p_order_id: payment.order_id, p_payment_id: payment.id } as never);
          // An order we never created (the account may serve other things): acknowledge so it is not retried.
          if (error && !error.message.includes("unknown order")) throw error;
        }
        break;
      }
      case "payment.failed": {
        if (payment?.order_id) await db.rpc("fail_payment", { p_order_id: payment.order_id } as never);
        break;
      }
      case "refund.processed": {
        const paymentId = event.payload?.refund?.entity?.payment_id;
        if (paymentId) {
          const { error } = await db.rpc("refund_payment", { p_payment_id: paymentId } as never);
          if (error) throw error;
        }
        break;
      }
    }
  } catch (e) {
    // A non-2xx response makes Razorpay retry later.
    console.error("webhook failed", event.event, e);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
