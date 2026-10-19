\set u '33333333-3333-3333-3333-333333333333'
insert into auth.users values (:'u','a@b.c') on conflict do nothing;
insert into payments (user_id, product_key, kind, credits, currency, base_minor, gst_minor, total_minor, igst_minor,
                      customer_name, customer_email, customer_phone, in_india, state_code, razorpay_order_id)
values (:'u','starter','plan',150,'INR',132000,23760,155760,23760,'A B','a@b.c','+919999999999',true,'29','order_1'),
       (:'u','pack-100','pack',100,'USD',1000,0,1000,0,'A B','a@b.c','+919999999999',false,null,'order_2');

select 'first fulfill reports 150 credits, not already done', credits = 150 and not already from fulfill_payment('order_1','pay_1');
select 'balance is 150 after fulfill', credit_balance(:'u') = 150;
select 'fulfill is idempotent', (select already from fulfill_payment('order_1','pay_1')) and credit_balance(:'u') = 150;
select 'webhook retry with another payment id is ignored', (select already from fulfill_payment('order_1','pay_other')) and credit_balance(:'u') = 150;
select 'invoice number format', invoice_no ~ '^SB/[0-9]{2}-[0-9]{2}/000001$' and length(invoice_no) <= 16 from payments where razorpay_order_id = 'order_1';
select fulfill_payment('order_2','pay_2') is not null;
select 'invoice numbers are consecutive', (select invoice_no from payments where razorpay_order_id='order_2') like '%/000002';
select 'grant row exists with pack source', exists (select 1 from credit_grants where source_ref = 'pay:pay_2' and source = 'pack' and amount = 100);

-- spend some of the first purchase, then refund it: only the unspent part is taken back
select start_job(:'u','x','google','video','p','{}',30,1,false) as j \gset
select 'balance after spend', credit_balance(:'u') = 220;
select refund_payment('pay_1') = 120 as taken;
select 'refund takes back unspent only', credit_balance(:'u') = 100;
select 'refund is idempotent', refund_payment('pay_1') = 0;
select 'payment marked refunded', status = 'refunded' from payments where razorpay_payment_id = 'pay_1';

select fail_payment('order_1');
select 'paid payment is not downgraded by fail', status = 'refunded' from payments where razorpay_order_id = 'order_1';

do $$ begin insert into payments (user_id, product_key, kind, credits, currency, base_minor, gst_minor, total_minor, customer_name, customer_email, customer_phone, in_india, razorpay_order_id)
  values ('33333333-3333-3333-3333-333333333333','x','pack',1,'USD',100,10,500,'a','a','a',false,'order_bad'); raise exception 'should have failed'; exception when check_violation then null; end $$;
select 'total must equal base plus gst', true;

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false) is not null;
select 'other user sees no payments', count(*) = 0 from payments;
do $$ begin perform fulfill_payment('order_2','pay_x'); raise exception 'should have failed'; exception when insufficient_privilege then null; end $$;
select 'client cannot fulfill', true;
reset role;

-- price per credit and margin revenue (migration 0009)
select 'usd pack grant stamped at $0.10 a credit', unit_price_micros = 100000 from credit_grants where source_ref = 'pay:pay_2';
select 'rupee plan grant stamped with unset list price stays null', unit_price_micros is null from credit_grants where source_ref = 'pay:pay_1';
