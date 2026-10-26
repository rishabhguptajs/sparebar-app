# Referral system plan

Branch: `feature/referrals-avatars-ui`. Nothing here is built yet.

## Decisions (agreed)

| Topic | Decision |
|---|---|
| Model | Revenue share. No reward for signups, only when a referred user pays. |
| Referrer share | 15% of net revenue on every purchase the referred user makes for 12 months from their first payment. |
| Net revenue | Amount the buyer paid (after the friend discount) minus the estimated payment fee (`PAYMENT_FEE_RATE`, 7%). |
| Payout | Built-in ledger. Referrer picks credits (instant, 20% bonus, $5 minimum) or cash by UPI, Indian bank transfer or Wise ($20 minimum, paid by hand after admin approval). No PayPal. Dodo has no payout or split API, so this stays outside Dodo. |
| Friend reward | 15% off their first pack or plan, applied through a Dodo discount code at checkout. |
| Who refers | Any signed-in user. Each gets a code and link in /app. |
| Attribution | `?ref=CODE` sets a 30 day cookie. At signup the referrer is locked onto the friend's profile for good. Self-referral blocked. |
| Abuse | Only paying users generate earnings, so signup farming costs nothing. Payouts need admin approval and big referrers are flagged. |

## Margin check (needs a decision before building)

Existing target is 50% margin after lab cost and payment fee. Referral share comes off the top of that:

- Referred sale, repeat purchase: 15% of 93% of revenue is about 14% of revenue, so a 50% margin becomes about 36%.
- Referred first sale: the 15% discount plus the share takes it to about 24% margin.

So referred customers are much thinner than normal ones. Share was lowered from 20% to 15% to protect this. Margin screens in admin should show referral payouts as a cost line so the real number is visible.

## Data model (migration `0014_referrals.sql`)

- `profiles`: add `referral_code text unique` (generated at signup, 8 chars, no lookalike characters), `referred_by uuid references profiles`, `referred_at timestamptz`, `referral_expires_at timestamptz` (set on the friend's first paid payment: now + 12 months).
- `referral_earnings`: `id`, `referrer_id`, `referred_id`, `payment_id` (unique, makes webhook retries safe), `net_micros`/`amount_usd_cents`, `status` (`pending` | `approved` | `paid` | `reversed`), `created_at`.
- `referral_payouts`: `id`, `referrer_id`, `amount_usd_cents`, `method`, `destination`, `status` (`requested` | `approved` | `paid` | `rejected`), `note`, timestamps.
- `payments`: add `discount_code`, `discount_cents`, `referral_applied bool`.
- Constraint: `referred_by <> id`. Referrer cannot be changed after it is set.
- RLS: users read their own earnings, payouts and referred counts only. Writes go through service-role functions.

## Flow

1. **Landing**: middleware sees `?ref=CODE` on any matcher path, validates the format and sets `sb_ref` (httpOnly, 30 days, lax). Never overwrites a referrer that was already locked on a profile.
2. **Signup**: in `src/app/auth/callback/route.ts`, after `recordProfile`, call a new `attachReferrer(user, code)`. It sets `referred_by` only if the profile is new, has none yet, the code exists and is not the user's own, and the email/device/IP do not match the referrer's (reuse `src/lib/abuse.ts` hashes). Then clears the cookie.
3. **First checkout**: in `src/app/api/billing/checkout/route.ts`, if the user has `referred_by` and zero paid payments, create or reuse a 15% Dodo discount code restricted to the chosen product and limited to one use, and pass it to `createCheckout` as `discount_code`. Record it on the `payments` row. Referred users see "15% off your first pack" on the credits page.
4. **Payment succeeded**: in the webhook handler, after `fulfill_payment`, a new `record_referral_earning(payment_id)` function runs in the same transaction: if the buyer has a referrer and the payment is inside the 12 month window, insert one `referral_earnings` row (15% of net). On the buyer's first paid payment it also sets `referral_expires_at`.
5. **Refund**: `refund_payment` marks the earning `reversed`. If it was already paid out, the amount is deducted from the referrer's next payout (balance can go negative).
6. **Payout**: earnings become `approved` once the refund window has passed (suggest 14 days). Referrer requests a payout from /app/referrals once approved balance is at least $20 (suggest), with a method and destination. Admin approves, pays outside the app, marks paid.

## UI

- `/app/referrals` (new): link and code with copy button, stats (referred, paying, earned, available, paid), earnings list, payout request form, short rules text.
- Credits page: banner for referred users with the 15% first-pack discount.
- Login page: small "You were invited" note when `sb_ref` is present.
- Admin: new "Referrals" tab (see `src/lib/admin-tabs.ts`) with top referrers, flags (over $100 earned or over 20 referred users, thresholds in config), earnings, and a payout queue with approve / reject / mark paid.
- Copy: never call Sparebar beta or invite-only. Say "refer a friend" and "earn 15% for 12 months".

## Config

`src/config/referral.ts`: `SHARE = 0.15`, `WINDOW_MONTHS = 12`, `COOKIE_DAYS = 30`, `FRIEND_DISCOUNT = 0.15`, `MIN_PAYOUT_USD = 20`, `HOLD_DAYS = 14`, `FLAG_EARNED_USD = 100`, `FLAG_REFERRED = 20`. Kill switch env `REFERRALS_ENABLED=false`.

## Analytics

Track `referral_link_visited`, `referral_attached`, `referral_discount_used`, `referral_earned`, `payout_requested` through `src/lib/analytics.ts`.

## Tests

- Unit: code generation, net/share maths, 12 month window edges, self-referral and same-device rejection.
- DB function tests for `record_referral_earning` (idempotent on webhook retry, refund reversal, window expiry).
- Manual in Dodo test mode: ref link, signup, discounted first checkout, earning appears, refund reverses it.

## Build order

1. Migration and config.
2. Cookie capture and signup attach.
3. Discount code at checkout.
4. Earning on payment and reversal on refund.
5. /app/referrals page and payout request.
6. Admin tab and payout queue.
7. Tests and Dodo test-mode run through.

## Open items

- Dodo discount code API details: confirm percentage in basis points, `restricted_to`, `usage_limit`, and that a code can be created per user per product, or one shared code per product with a usage limit per customer.
- Confirm margin decision above.
- Legal: terms page needs an affiliate clause and a payout/tax note, since payouts are your responsibility.
