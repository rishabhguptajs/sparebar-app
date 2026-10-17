\set u '11111111-1111-1111-1111-111111111111'
insert into auth.users values (:'u', 'a@b.c');
select 'profile created', count(*) = 1 from profiles;
select 'free grant', grant_credits(:'u', 2, 'free', 'signup', 'signup:a', '{image}', now() + interval '7 days') is not null;
select 'idempotent grant', grant_credits(:'u', 2, 'free', 'signup', 'signup:a', '{image}', now() + interval '7 days') = (select id from credit_grants where source_ref='signup:a');
select 'paid grant', grant_credits(:'u', 10, 'paid', 'pack', 'pay_123') is not null;
select 'balances 12/10/10', credit_balance(:'u') = 12 and credit_balance(:'u','video') = 10 and credit_balance(:'u','image',false) = 10;
select start_job(:'u','nano-banana-2.1','google','image','p','{}',2,33600,true) as j1 \gset
select 'free used first', (select remaining from credit_grants where source_ref='signup:a') = 0;
select settle_job(:'j1', '[]', 30000); select settle_job(:'j1', '[]', 30000);
select 'settled with actual cost', status='succeeded' and lab_cost_micros=30000 and lab_cost_is_actual from jobs where id=:'j1';
select 'one settle entry', count(*) = 1 from credit_entries where job_id=:'j1' and type='settle';
select start_job(:'u','gemini-omni-flash','google','video','p','{}',8,800000,false) as j2 \gset
select 'balance 2 after video reserve', credit_balance(:'u') = 2;
select refund_job(:'j2','boom'); select refund_job(:'j2','boom');
select 'refunded once', credit_balance(:'u') = 10 and (select status from jobs where id=:'j2')='failed';
do $$ begin perform start_job('11111111-1111-1111-1111-111111111111','x','google','video','p','{}',50,1,false); raise exception 'should have failed'; exception when others then if sqlerrm <> 'insufficient_credits' then raise; end if; end $$;
select 'insufficient writes no job', count(*)=2 from jobs;
-- free credits cannot pay for a non free-eligible image model
update credit_grants set remaining = 0 where source_ref = 'pay_123';
select grant_credits(:'u', 5, 'free', 'promo', 'promo:1', '{image}', now() + interval '1 day') is not null;
do $$ begin perform start_job('11111111-1111-1111-1111-111111111111','nano-banana-pro','google','image','p','{}',5,134000,false); raise exception 'should have failed'; exception when others then if sqlerrm <> 'insufficient_credits' then raise; end if; end $$;
select 'free credits blocked for paid-only model', true;
select grant_credits(:'u', 10, 'paid', 'pack', 'pay_456') is not null;
select 'claim finished job blocked', count(*)=0 from claim_job(:'j1');
select start_job(:'u','gemini-omni-flash','google','video','p','{}',8,800000,false) as j3 \gset
select 'claim lease 1', count(*)=1 from claim_job(:'j3');
select 'claim lease 2 blocked', count(*)=0 from claim_job(:'j3');
do $$ begin update credit_entries set amount=0; raise exception 'should have failed'; exception when others then if sqlerrm <> 'credit_entries is append-only' then raise; end if; end $$;
select 'ledger append-only', true;
-- the manual zeroing above bypassed the ledger on purpose; compare only for the second user below
insert into auth.users values ('22222222-2222-2222-2222-222222222222','x@y.z');
select grant_credits('22222222-2222-2222-2222-222222222222', 2, 'free','signup','signup:x','{image}', now() - interval '1 second') is not null;
select grant_credits('22222222-2222-2222-2222-222222222222', 6, 'paid','pack','pay_x') is not null;
select start_job('22222222-2222-2222-2222-222222222222','gemini-omni-flash','google','video','p','{}',4,1,false) as j4 \gset
select refund_job(:'j4','x');
select 'expire one', expire_grants() = 1;
select 'ledger sum = cached remaining', (select sum(amount) from credit_entries where user_id='22222222-2222-2222-2222-222222222222') = (select sum(remaining) from credit_grants where user_id='22222222-2222-2222-2222-222222222222');
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false) is not null;
select 'cannot read others balance', credit_balance('11111111-1111-1111-1111-111111111111') = 0;
select 'own balance readable', credit_balance('22222222-2222-2222-2222-222222222222') = 6;
select 'rls hides other jobs', count(*) = 1 from jobs;
do $$ begin perform grant_credits('22222222-2222-2222-2222-222222222222', 999,'paid','admin','hack'); raise exception 'should have failed'; exception when insufficient_privilege then null; end $$;
select 'authenticated cannot grant', true;
reset role;
