# Analytics

Tools: PostHog (events, only after the visitor accepts the banner) and Vercel Analytics (cookieless, always on).
Set `NEXT_PUBLIC_POSTHOG_KEY` (and optionally `NEXT_PUBLIC_POSTHOG_HOST`) in `.env.local` and in Vercel. With no key nothing is sent and no banner shows.
Session recording is off on purpose.

## Events

Browser (need consent):
- `$pageview`, `$pageleave` (scroll depth), `$autocapture` clicks. Key buttons carry `data-attr`: `cta-hero-start`, `cta-footer-start`, `nav-sign-in`.
- `pricing_clicked` (home page plan button), `video_played` (ad and guide videos)
- `login_code_requested`, `login_code_failed`, `login_google_clicked`, `login_code_wrong`, `login_code_verified`
- `plan_clicked`, `checkout_opened`, `payment_failed` (credits page)

Server (keyed on user id, sent if a key is set):
- `signed_in` (free_credits outcome), `feature_used` (area, template, kind, has_character, has_product, ...), `out_of_credits`, `credits_purchased`

Traffic source and UTM tags come from PostHog's built in referrer and `utm_*` properties. Tag Reddit links like `?utm_source=reddit&utm_medium=post&utm_campaign=launch`.

## Funnels to build in PostHog
1. Visitor: `$pageview` (/) -> `cta-hero-start` click -> `login_code_requested` -> `signed_in` -> `feature_used`
2. Money: `out_of_credits` -> `plan_clicked` -> `checkout_opened` -> `credits_purchased`
Breakdown the first by `utm_source`. Use Trends on `feature_used` broken down by `area`.
