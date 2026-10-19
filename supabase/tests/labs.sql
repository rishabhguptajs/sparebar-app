-- Isolate from jobs created by the other test files (scratch database only).
truncate jobs, credit_entries cascade;
insert into auth.users values ('55555555-5555-5555-5555-555555555555','l@x.co') on conflict do nothing;
select 'all five labs are listed', count(*) = 5 from lab_stats();
select 'no balance recorded yet', not has_balance from lab_stats() where lab = 'xai';

insert into lab_balances (lab, recorded, balance_micros, recorded_at) values ('google', true, 40000000, now() - interval '1 hour');
select 'balance is recorded', has_balance and balance_micros = 40000000 from lab_stats() where lab = 'google';

insert into jobs (user_id, model_key, lab, kind, prompt, status, credits_charged, lab_cost_micros, created_at)
values ('55555555-5555-5555-5555-555555555555','nano-banana-2.1','google','image','a','succeeded',2,33600, now() - interval '30 minutes'),
       ('55555555-5555-5555-5555-555555555555','nano-banana-2.1','google','image','b','failed',2,33600, now() - interval '20 minutes'),
       ('55555555-5555-5555-5555-555555555555','gemini-omni-flash','google','video','c','succeeded',27,800000, now() - interval '10 minutes'),
       ('55555555-5555-5555-5555-555555555555','nano-banana-2.1','google','image','old','succeeded',2,33600, now() - interval '3 days');
select 'spend since recording ignores failed and older jobs', spent_since_micros = 833600 from lab_stats() where lab = 'google';
select 'seven day spend includes older job, not failed', spent_7d_micros = 867200 from lab_stats() where lab = 'google';
select 'first job time is reported', first_job_at is not null from lab_stats() where lab = 'google';

select note_lab_billing_error('xai');
select 'billing error is noted without recording a balance', billing_error_at is not null and not has_balance from lab_stats() where lab = 'xai';
select note_lab_billing_error('google');
select 'noting an error keeps the recorded balance', balance_micros = 40000000 and has_balance from lab_stats() where lab = 'google';

select 'margins group by model', ok_jobs = 2 and failed_jobs = 1 and credits = 4 and lab_cost_micros = 67200 from model_margins(30) where model_key = 'nano-banana-2.1';
select 'margins respect the window', ok_jobs = 1 from model_margins(1) where model_key = 'nano-banana-2.1';
select 'margins accept all time', count(*) >= 2 from model_margins(null);

set role authenticated;
do $$ begin perform * from lab_stats(); raise exception 'should have failed'; exception when insufficient_privilege then null; end $$;
select 'clients cannot read lab stats', true;
select 'clients see no lab balances', count(*) = 0 from lab_balances;
reset role;
