\set u '33333333-3333-3333-3333-333333333333'
insert into auth.users values (:'u','a@b.c') on conflict do nothing;
insert into payments (user_id, product_key, kind, credits, currency, base_minor, total_minor,
                      customer_name, customer_email, checkout_session_id)
values (:'u','starter','plan',150,'USD',1500,1500,'A B','a@b.c','order_1'),
       (:'u','pack-100','pack',100,'USD',1000,1000,'A B','a@b.c','order_2');

select 'first fulfill reports 150 credits, not already done', credits = 150 and not already from fulfill_payment('order_1','pay_1');
select 'balance is 150 after fulfill', credit_balance(:'u') = 150;
select 'fulfill is idempotent', (select already from fulfill_payment('order_1','pay_1')) and credit_balance(:'u') = 150;
select 'webhook retry with another payment id is ignored', (select already from fulfill_payment('order_1','pay_other')) and credit_balance(:'u') = 150;
select fulfill_payment('order_2','pay_2') is not null;
select 'grant row exists with pack source', exists (select 1 from credit_grants where source_ref = 'pay:pay_2' and source = 'pack' and amount = 100);

-- spend some of the first purchase, then refund it: only the unspent part is taken back
select start_job(:'u','x','google','video','p','{}',30,1,false) as j \gset
select 'balance after spend', credit_balance(:'u') = 220;
select refund_payment('pay_1') = 120 as taken;
select 'refund takes back unspent only', credit_balance(:'u') = 100;
select 'refund is idempotent', refund_payment('pay_1') = 0;
select 'payment marked refunded', status = 'refunded' from payments where provider_payment_id = 'pay_1';

select fail_payment('order_1');
select 'paid payment is not downgraded by fail', status = 'refunded' from payments where checkout_session_id = 'order_1';

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false) is not null;
select 'other user sees no payments', count(*) = 0 from payments;
do $$ begin perform fulfill_payment('order_2','pay_x'); raise exception 'should have failed'; exception when insufficient_privilege then null; end $$;
select 'client cannot fulfill', true;
reset role;

-- price per credit and margin revenue (migration 0009)
select 'usd pack grant stamped at $0.10 a credit', unit_price_micros = 100000 from credit_grants where source_ref = 'pay:pay_2';
select 'starter grant stamped at $0.10 a credit', unit_price_micros = 100000 from credit_grants where source_ref = 'pay:pay_1';
