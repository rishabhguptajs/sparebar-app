-- Run in the Supabase SQL editor after the app is deployed (safe to run again: it replaces the old jobs).
-- Uses pg_cron + pg_net (both available on the free plan) to call the app, because Vercel Hobby cron only
-- runs once a day.
-- Replace both placeholders before running. Keep the secret out of git.
--
-- Built to keep hosting usage low. Every call to the app is a billed function run, so:
--   1. The job tick checks the database first and only calls the app when a job is actually due.
--      An idle site makes no calls at all (it used to make 1,440 a day).
--   2. Expiring free credits is plain SQL, so it needs no call to the app.
--   3. The lab balance check (a live OpenRouter request) runs once an hour.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace the old one-call-a-minute job, if it exists.
select cron.unschedule(jobid) from cron.job where jobname in ('sparebar-tick', 'sparebar-housekeeping', 'sparebar-expire');

-- Every minute, but only calls the app when a running job is due or a queued job has gone stale.
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
  )
  where exists (
    select 1 from public.jobs
    where (status = 'running' and next_poll_at <= now())
       or (status = 'queued' and created_at < now() - interval '5 minutes')
  );
  $$
);

-- Every hour: expire old free credits, in the database, with no call to the app.
select cron.schedule('sparebar-expire', '5 * * * *', $$ select public.expire_grants(); $$);

-- Every hour: lab balance alerts (the app reads OpenRouter's live balance and may post to the alert webhook).
select cron.schedule(
  'sparebar-housekeeping',
  '10 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-DEPLOYMENT-URL/api/cron/tick?task=housekeeping',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- To remove: select cron.unschedule('sparebar-tick'); select cron.unschedule('sparebar-expire'); select cron.unschedule('sparebar-housekeeping');
