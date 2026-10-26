// Referral program. A referrer earns a share of what the people they refer pay, for a limited time.
export const REFERRAL = {
  /** Referrer's share of net revenue (what the buyer paid, minus the payment fee). */
  share: 0.15,
  /** The referrer keeps earning for this long after the friend's first payment. */
  windowMonths: 12,
  /** How long a ?ref= link is remembered in the browser. */
  cookieDays: 30,
  /** Friend's discount on their first purchase, in basis points as Dodo expects (1500 = 15%). */
  friendDiscountBp: 1500,
  /** Earnings wait this long, so a refund can still reverse them, before they can be paid out. */
  holdDays: 14,
  /** Smallest cash payout a referrer can request, in USD cents. */
  minPayoutCents: 2000,
  /** Taking earnings as credits is instant and needs a smaller balance. */
  minCreditPayoutCents: 500,
  /** Credits are worth more than cash: $1 earned = $1 of credits at the base rate (10 credits) plus this bonus. */
  creditBonus: 0.2,
  /** Referrers above either number show a flag in admin so payouts get a closer look. */
  flagEarnedCents: 10000,
  flagReferred: 20,
} as const;

/** How cash payouts reach a referrer. We pay these by hand, so list only what the owner can send. */
export const PAYOUT_METHODS = ["upi", "bank", "wise", "credits"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];
export const creditsPerDollar = () => 10 * (1 + REFERRAL.creditBonus);

/** Name of the cookie that remembers which referrer sent this browser. */
export const REFERRAL_COOKIE = "sb_ref";

/** Referral codes avoid look-alike characters (0/O, 1/I/L). */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 8;

export const referralEnabled = () => process.env.REFERRALS_ENABLED !== "false";
