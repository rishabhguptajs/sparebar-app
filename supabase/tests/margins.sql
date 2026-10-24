\set u '44444444-4444-4444-4444-444444444444'
insert into auth.users values (:'u','m@b.c') on conflict do nothing;
insert into payments (user_id, product_key, kind, credits, list_usd_cents, currency, base_minor, total_minor,
                      customer_name, customer_email, checkout_session_id)
values (:'u','studio','plan',1100,9900,'USD',9900,9900,'M B','m@b.c','order_m');
select fulfill_payment('order_m','pay_m') is not null;
select 'studio grant is $0.09 a credit', unit_price_micros = 90000 from credit_grants where source_ref = 'pay:pay_m';

select grant_credits(:'u', 2, 'free', 'signup', 'signup:m', '{image}', now() + interval '7 days') is not null;
-- free credits are drawn first (soonest expiry), then paid ones
select start_job(:'u','m1','google','image','p','{}',2,2,true) as j1 \gset
select start_job(:'u','m1','google','image','p','{}',10,10,false) as j2 \gset
select settle_job(:'j1', '[]'::jsonb, 1000);
select settle_job(:'j2', '[]'::jsonb, 5000);
select 'revenue is credits drawn from priced grants times their price',
  revenue_micros = 10 * 90000 and free_credits = 2 and credits = 12 and ok_jobs = 2
  from model_margins(30) where model_key = 'm1';
