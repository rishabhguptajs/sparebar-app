# Sparebar

Create AI characters and generate UGC style images and videos with them. Next.js app, Supabase for auth and data, Cloudflare R2 for media, lab APIs called directly.

## Status

Build step 1 is done: auth, credits ledger, provider adapter with Google (Nano Banana 2.1 and Gemini Omni Flash), and job runner. `/app` is a temporary playground for testing. The studio UI comes in step 2.

## Setup (free tiers)

1. **Supabase** (free project). Open SQL editor, run `supabase/migrations/0001_init.sql`. In Auth > URL Configuration, add `http://localhost:3000/auth/callback` and your deployed URL to redirect URLs.
2. **Cloudflare R2.** Create a private bucket `sparebar-media` and an API token with Object Read and Write on it.
3. **Google AI Studio.** Create an API key on a project with prepaid billing.
4. Copy `.env.example` to `.env.local` and fill in the keys.
5. `pnpm dev`, sign in at `/login`, then give yourself test credits in the Supabase SQL editor:
   ```sql
   select grant_credits((select id from auth.users where email = 'you@example.com'), 50, 'paid', 'admin', 'admin:test-1');
   ```
6. After deploying, fill in the URL and `CRON_SECRET` in `supabase/setup/cron.sql` and run it once. This calls `/api/cron/tick` every minute, which advances video jobs when no tab is open and expires old free credits.

## How it fits together

- `src/config/models.ts`: model catalog. A model is one entry with lab, API id, kind and dated prices. Add a price row with a future `effectiveFrom` for announced changes.
- `src/lib/credits.ts`: `credits = ceil(lab cost / $0.03)`, in integer micro-USD.
- `src/lib/providers/`: one adapter per lab (`submit`, `poll`). Register new labs in `index.ts`.
- `src/lib/jobs/run.ts`: `startJob` reserves credits and submits. `advanceJob` polls, stores output on R2, and settles or refunds. The status route and the cron tick both call it, and a lease in `claim_job` stops double processing.
- `supabase/migrations/0001_init.sql`: grants (each with bucket, allowed kinds and expiry), the append-only `credit_entries` ledger, and `jobs` with `credits_charged` next to `lab_cost_micros`. All credit writes go through security definer functions that lock the user row.

## Checks

```bash
pnpm test        # credit math against the launch catalog
pnpm typecheck
pnpm build
```

SQL tests: run `supabase/tests/00_auth_stub.sql`, the migration, then `supabase/tests/ledger.sql` against an empty local Postgres 16. Every labeled row should end in `t`; blank lines are calls that return nothing.

## Notes

- Vercel Hobby is for non-commercial use. Move to Vercel Pro or Cloudflare (OpenNext) before taking payments.
- Supabase free pauses a project after 7 days without activity.
- Gemini Omni has no duration setting, so clip length follows the prompt. Credits are charged on an 8 second estimate, and the real cost is logged from the token usage Google reports.
