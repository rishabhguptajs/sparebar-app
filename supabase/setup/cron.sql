-- Run once in the Supabase SQL editor after the app is deployed.
-- Uses pg_cron + pg_net (both available on the free plan) to call the app's
-- tick route every minute, because Vercel Hobby cron only runs once a day.
-- Replace both placeholders before running. Keep the secret out of git.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'sparebar-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-DEPLOYMENT-URL/api/cron/tick',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- To remove: select cron.unschedule('sparebar-tick');
