import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/dodo";
import { admin } from "@/lib/supabase/admin";
import { track } from "@/lib/analytics";
import { notifyOwner } from "@/lib/notify";
import { recordEarning, reverseEarning } from "@/lib/referral";

type Event = {
  type: string;
  data?: { payment_id?: string; checkout_session_id?: string | null; metadata?: { user_id?: string } };
};

// Dodo webhook. Set it to send payment.succeeded, payment.failed and refund.succeeded.
// Duplicate deliveries are expected: every action below is safe to repeat.
export async function POST(req: Request) {
  const raw = await req.text(); // the signature covers the raw body, so do not parse it first
  if (!verifyWebhook(raw, req.headers)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: Event;
  try {
    event = JSON.parse(raw) as Event;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const db = admin();
  const { payment_id: paymentId, checkout_session_id: sessionId } = event.data ?? {};

  try {
    switch (event.type) {
      case "payment.succeeded": {
        if (paymentId && sessionId) {
          const { data, error } = await db.rpc("fulfill_payment", { p_order_id: sessionId, p_payment_id: paymentId } as never);
          // A session we never created (the account may serve other things): acknowledge so it is not retried.
          if (error && !error.message.includes("unknown order")) throw error;
          const row = (data as { user_id: string; credits: number; already: boolean }[] | null)?.[0];
          if (row) await recordEarning(paymentId); // safe on repeats: one earning per payment
          if (row && !row.already) {
            track(row.user_id, "credits_purchased", { credits: row.credits });
            const { data: buyer } = await db.from("profiles").select("email").eq("id", row.user_id).maybeSingle();
            notifyOwner(`Sparebar payment: ${row.credits} credits`, [
              `Buyer: ${(buyer as { email: string | null } | null)?.email ?? row.user_id}`,
              `Credits: ${row.credits}`,
              `Dodo payment: ${paymentId}`,
            ]);
          }
        }
        break;
      }
      case "payment.failed": {
        if (sessionId) await db.rpc("fail_payment", { p_order_id: sessionId } as never);
        break;
      }
      case "refund.succeeded": {
        if (paymentId) {
          const { error } = await db.rpc("refund_payment", { p_payment_id: paymentId } as never);
          if (error) throw error;
          await reverseEarning(paymentId);
        }
        break;
      }
    }
  } catch (e) {
    // A non-2xx response makes Dodo retry later.
    console.error("webhook failed", event.type, e);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
