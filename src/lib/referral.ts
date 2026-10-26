import "server-only";
import { brand } from "@/config/brand";
import { REFERRAL, creditsPerDollar, referralEnabled } from "@/config/referral";
import { newReferralCode } from "@/lib/referral-code";
import { PAYMENT_FEE_RATE } from "@/lib/margin";
import { admin } from "@/lib/supabase/admin";

export type ReferralSummary = {
  code: string;
  link: string;
  referred: number;
  paying: number;
  pendingCents: number;
  availableCents: number;
  paidCents: number;
  minPayoutCents: number;
  minCreditPayoutCents: number;
  creditsPerDollar: number;
  openPayout: { amountCents: number; createdAt: string } | null;
  earnings: { id: string; amountCents: number; status: string; availableAt: string; createdAt: string; note: string | null }[];
  payouts: { id: string; amountCents: number; status: string; method: string; createdAt: string }[];
};

/** The user's code, made the first time it is asked for. Never changes afterwards. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const db = admin();
  const { data } = await db.from("profiles").select("referral_code").eq("id", userId).maybeSingle();
  const have = (data as { referral_code: string | null } | null)?.referral_code;
  if (have) return have;
  for (let i = 0; i < 5; i++) {
    const code = newReferralCode();
    const { data: saved, error } = await db
      .from("profiles")
      .update({ referral_code: code } as never)
      .eq("id", userId)
      .is("referral_code", null)
      .select("referral_code")
      .maybeSingle();
    if (!error && saved) return (saved as { referral_code: string }).referral_code;
    // Someone else set it in the meantime, or the code was taken: read again, then try a new code.
    const { data: again } = await db.from("profiles").select("referral_code").eq("id", userId).maybeSingle();
    const now = (again as { referral_code: string | null } | null)?.referral_code;
    if (now) return now;
  }
  throw new Error("could not make a referral code");
}

/** Locks the referrer in for a new account. Never throws: a problem here must not block signing in. */
export async function attachReferrer(userId: string, code: string): Promise<string> {
  if (!referralEnabled()) return "off";
  try {
    const { data, error } = await admin().rpc("attach_referrer", { p_user: userId, p_code: code } as never);
    if (error) throw error;
    return String(data);
  } catch (e) {
    console.error("attach referrer failed", e);
    return "error";
  }
}

/** Referred user, no purchase yet: their first checkout gets the friend discount. */
export async function eligibleForFriendDiscount(userId: string): Promise<boolean> {
  if (!referralEnabled()) return false;
  const db = admin();
  const { data } = await db.from("profiles").select("referred_by").eq("id", userId).maybeSingle();
  if (!(data as { referred_by: string | null } | null)?.referred_by) return false;
  const { count } = await db
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["paid", "refunded"]);
  return (count ?? 0) === 0;
}

/** Called after a payment is fulfilled. Never throws: the credits are already granted. */
export async function recordEarning(providerPaymentId: string) {
  if (!referralEnabled()) return;
  const { error } = await admin().rpc("record_referral_earning", {
    p_payment_id: providerPaymentId,
    p_share: REFERRAL.share,
    p_fee: PAYMENT_FEE_RATE,
    p_window_months: REFERRAL.windowMonths,
    p_hold_days: REFERRAL.holdDays,
  } as never);
  if (error) console.error("referral earning failed", error.message);
}

export async function reverseEarning(providerPaymentId: string) {
  const { error } = await admin().rpc("reverse_referral_earning", { p_payment_id: providerPaymentId } as never);
  if (error) console.error("referral reversal failed", error.message);
}

export async function referralSummary(userId: string): Promise<ReferralSummary> {
  const db = admin();
  const code = await ensureReferralCode(userId);
  const [referredRows, earningRows, payoutRows] = await Promise.all([
    db.from("profiles").select("id").eq("referred_by", userId),
    db
      .from("referral_earnings")
      .select("id, referred_id, amount_cents, status, available_at, payout_id, note, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("referral_payouts")
      .select("id, amount_cents, status, method, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const referred = (referredRows.data ?? []) as { id: string }[];
  const earnings = (earningRows.data ?? []) as {
    id: string;
    referred_id: string | null;
    amount_cents: number;
    status: string;
    available_at: string;
    payout_id: string | null;
    note: string | null;
    created_at: string;
  }[];
  const payouts = (payoutRows.data ?? []) as { id: string; amount_cents: number; status: string; method: string; created_at: string }[];
  const statusOf = new Map(payouts.map((p) => [p.id, p.status]));

  const now = Date.now();
  let pending = 0;
  let available = 0;
  let paid = 0;
  for (const e of earnings) {
    if (e.status !== "active") continue;
    const payout = e.payout_id ? statusOf.get(e.payout_id) : null;
    if (payout === "paid") paid += e.amount_cents;
    else if (payout === "requested") continue; // already in a request, counted there
    else if (Date.parse(e.available_at) <= now) available += e.amount_cents;
    else pending += e.amount_cents;
  }
  const open = payouts.find((p) => p.status === "requested");
  return {
    code,
    link: `${brand.url}/?ref=${code}`,
    referred: referred.length,
    paying: new Set(earnings.filter((e) => e.referred_id && e.amount_cents > 0).map((e) => e.referred_id)).size,
    pendingCents: pending,
    availableCents: Math.max(0, available),
    paidCents: paid,
    minPayoutCents: REFERRAL.minPayoutCents,
    minCreditPayoutCents: REFERRAL.minCreditPayoutCents,
    creditsPerDollar: creditsPerDollar(),
    openPayout: open ? { amountCents: open.amount_cents, createdAt: open.created_at } : null,
    earnings: earnings.slice(0, 50).map((e) => ({ id: e.id, amountCents: e.amount_cents, status: e.status, availableAt: e.available_at, createdAt: e.created_at, note: e.note })),
    payouts: payouts.map((p) => ({ id: p.id, amountCents: p.amount_cents, status: p.status, method: p.method, createdAt: p.created_at })),
  };
}
