# Sparebar

Create AI characters and generate UGC style images and videos with them. Next.js app, Supabase for auth and data, Cloudflare R2 for media, lab APIs called directly with no aggregator in between. Domain and brand live in `src/config/brand.ts`.

## What is built

| Area | State |
|---|---|
| Sign in (email link), credits ledger, job runner | Done, SQL tested |
| Studio, characters, library, credits page, GST invoices | Done, checked in the browser with sample data |
| Razorpay checkout, verify and webhook routes | Done, fulfillment SQL tested, **not run against Razorpay** |
| Terms, privacy, refund pages | Drafted, **needs a lawyer or CA to review** |
| Free tier with device, email, network checks | Done, SQL tested |
| Lab balance alerts, margin per model, admin page | Done, SQL and logic tested |
| Google adapter (Nano Banana 2.1, Gemini Omni Flash) | Done, request shapes tested, **not run live** |
| xAI, MiniMax H3, Alibaba Wan 3.0 adapters | Done, tested with mocked responses, models off until funded |
| Landing page | Done |

Nothing has run against a real Supabase, Razorpay, R2 or lab account yet. The first live run is where surprises will show up.

## First run

1. **Supabase** (free project). In the SQL editor run every file in `supabase/migrations/` in order (`0001` to `0005`). In Auth > URL Configuration add `http://localhost:3000/auth/callback` and your deployed URL to the redirect URLs.
2. **Cloudflare R2.** Create a private bucket and an API token with Object Read and Write on it.
3. **Google AI Studio.** Create a key on a project with prepaid billing.
4. Fill in `.env.local` (a template with a generated `CRON_SECRET` and `ABUSE_SALT` is already there).
5. `pnpm dev`, then sign in at `/login`.
6. Make yourself admin and give yourself test credits in the SQL editor:
   ```sql
   update profiles set is_admin = true where email = 'you@example.com';
   select grant_credits((select id from auth.users where email = 'you@example.com'), 50, 'paid', 'admin', 'admin:test-1');
   ```
   After that, `/app/admin` can add credits by email.
7. **First live test, in this order:** a Nano Banana image, then a Gemini Omni video. See the checks below.
8. After deploying, fill in the URL and `CRON_SECRET` in `supabase/setup/cron.sql` and run it once. It calls `/api/cron/tick` every minute to advance video jobs when no tab is open, expire free credits, and check lab balances.

## Environment

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Everything |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Saving generated media |
| `GEMINI_API_KEY` | Google models |
| `XAI_API_KEY`, `MINIMAX_API_KEY`, `DASHSCOPE_API_KEY`, `ALIBABA_BASE_URL` | Those labs, once funded |
| `CRON_SECRET` | The minute tick |
| `ABUSE_SALT` | Free credits. They stay off until it is set |
| `FREE_CREDITS_ENABLED` | Set to `false` to pause new free grants |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payments |
| `INR_PER_USD` | Indian checkout. Leave empty to switch it off |
| `SELLER_STATE_CODE`, `SELLER_GSTIN`, `SELLER_ADDRESS`, `SELLER_LUT_NUMBER` | Invoices |
| `ALERT_WEBHOOK_URL` | Low balance alerts (Slack or Discord webhook) |

## Turning on a lab

Each model is one entry in `src/config/models.ts`. To switch on xAI, MiniMax or Wan: add its key to `.env.local`, fund the account, set `enabled: true` on its models, run one generation from the studio, and compare the cost shown in `/app/admin` with the lab console. Then record the lab balance in Admin so the low balance alerts start tracking it.

## How it fits together

- `src/config/`: brand, models with dated prices, plans and packs, free tier. Prices live here, not in code.
- `src/lib/credits.ts`: `credits = ceil(lab cost / $0.03)` in integer micro-USD.
- `src/lib/providers/`: one adapter per lab with `submit` and `poll`. Register new labs in `index.ts`.
- `src/lib/jobs/run.ts`: `startJob` reserves credits and submits. `advanceJob` polls, saves output to R2, then settles or refunds. The status route and the minute tick share it, guarded by a lease.
- `src/lib/labs.ts`: lab balance estimate, runway and alert logic. A billing style error from a lab (HTTP 401, 402, 403, or a flag an adapter sets from the lab's error code) pauses that lab's models for 15 minutes and alerts at once.
- `supabase/migrations/`: schema and the functions that move credits and money. All writes to credits go through security definer functions.
- `/preview` (development only): the app UI with sample data, no keys needed.

## Checks

```bash
pnpm test        # 65 tests: credits, tax, abuse rules, lab alerts, margins, all four adapters
pnpm typecheck
pnpm lint
pnpm build
```

SQL tests: apply `supabase/tests/00_auth_stub.sql`, then every migration, then each file in `supabase/tests/` against an empty local Postgres 16. Every labeled row should end in `t`.

## Not yet confirmed against the real service

- **Omni video in the background.** The code starts it with `background: true` and expects an id back at once. If Omni ignores that and renders in the request, the function times out and the job refunds after 5 minutes while Google still bills it. Test this first.
- **Omni clip length.** There is no duration field, so length follows the prompt. Credits assume 8 seconds. A longer clip costs more than it was charged. The real cost is logged per job.
- **Image response shape and token usage names** in the Google adapter.
- **xAI** image edit response, and prices: the docs list lower per second prices than the brief, so the brief's numbers are used (the safe side).
- **MiniMax** base64 first frame. **Alibaba** base64 first frame, the per second price, and preview access approval.
- **Razorpay:** international payments approval, subscriptions on foreign cards (plans are sold as manual monthly renewals until confirmed), the forex markup, and real webhook delivery.
- **R2** honoring the download filename on signed links.
- **Supabase email:** the built in sender is rate limited. Set up custom SMTP before real users sign in.
- **Sign in code.** Email links only work in the browser that asked for them, which fails in many phone mail apps. The login page also accepts a code, but the Supabase email template must include it: in Auth > Email Templates > Magic Link add a line such as `Or enter this code: {{ .Token }}`.

## Decisions made on your behalf

- Plans are monthly manual renewals. Paid credits do not expire. Free credits are 2, image only, expire in 14 days.
- Refund policy: within 7 days if none of the credits are spent. Drafted in `src/app/(legal)/refunds`.
- Rupee price is the dollar price times `INR_PER_USD`, plus 18% GST. CGST and SGST in the seller state, IGST elsewhere. Outside India is treated as an export of services under LUT. Have a CA confirm all of this.
- Hosting: Vercel Hobby is for non-commercial use. Move to a paid plan or another host before taking payments.
