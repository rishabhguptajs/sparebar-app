-- Price paid per credit, so the admin margin report values each credit at what the buyer paid.
-- unit_price_micros is US dollars per credit in micro-USD, before GST. Null or 0 means no revenue
-- (free credits, admin grants).
-- For rupee payments the dollar list price of the product is used, which is an approximation.

alter table public.credit_grants add column if not exists unit_price_micros integer check (unit_price_micros >= 0);
alter table public.payments add column if not exists list_usd_cents integer check (list_usd_cents > 0);

-- Backfill: dollar payments are their own list price; rupee payments map by product key.
update public.payments
   set list_usd_cents = case
     when currency = 'USD' then base_minor
     else case product_key
       when 'starter' then 1500 when 'creator' then 3900 when 'studio' then 9900
       when 'pack-100' then 1000 when 'pack-270' then 2500 when 'pack-560' then 5000
     end
   end
 where list_usd_cents is null;

update public.credit_grants g
   set unit_price_micros = round(p.list_usd_cents * 10000.0 / p.credits)
  from public.payments p
 where g.source_ref = 'pay:' || p.razorpay_payment_id
   and p.list_usd_cents is not null
   and g.unit_price_micros is null;

-- fulfill_payment now stamps the grant with the price per credit.
create or replace function public.fulfill_payment(p_order_id text, p_payment_id text)
returns table (user_id uuid, credits integer, already boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  pay payments%rowtype;
  usd_cents bigint;
begin
  select * into pay from payments where razorpay_order_id = p_order_id for update;
  if not found then
    raise exception 'unknown order %', p_order_id;
  end if;

  if pay.status in ('paid', 'refunded') then
    return query select pay.user_id, pay.credits, true;
    return;
  end if;

  update payments
     set status = 'paid',
         razorpay_payment_id = p_payment_id,
         paid_at = now(),
         invoice_no = next_invoice_no()
   where id = pay.id;

  perform grant_credits(pay.user_id, pay.credits, 'paid', pay.kind, 'pay:' || p_payment_id);

  usd_cents := coalesce(pay.list_usd_cents, case when pay.currency = 'USD' then pay.base_minor end);
  if usd_cents is not null then
    update credit_grants
       set unit_price_micros = round(usd_cents * 10000.0 / pay.credits)
     where source_ref = 'pay:' || p_payment_id;
  end if;

  return query select pay.user_id, pay.credits, false;
end;
$$;

revoke execute on function public.fulfill_payment(text, text) from public, anon, authenticated;
grant execute on function public.fulfill_payment(text, text) to service_role;

-- Margin per model with revenue taken from the grants each job drew from.
-- free_credits counts credits that earned no revenue (free or admin grants).
drop function if exists public.model_margins(integer);
create or replace function public.model_margins(p_days integer default 30)
returns table (
  model_key text,
  ok_jobs bigint,
  failed_jobs bigint,
  credits bigint,
  lab_cost_micros bigint,
  actual_cost_jobs bigint,
  revenue_micros bigint,
  free_credits bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with draw as (
    select e.job_id,
           sum(-e.amount)::bigint as credits,
           sum(-e.amount * coalesce(g.unit_price_micros, 0))::bigint as revenue,
           coalesce(sum(-e.amount) filter (where coalesce(g.unit_price_micros, 0) = 0), 0)::bigint as free
      from credit_entries e
      join credit_grants g on g.id = e.grant_id
     where e.type = 'reserve'
     group by e.job_id
  )
  select
    j.model_key,
    count(*) filter (where j.status = 'succeeded'),
    count(*) filter (where j.status = 'failed'),
    coalesce(sum(j.credits_charged) filter (where j.status = 'succeeded'), 0)::bigint,
    coalesce(sum(j.lab_cost_micros) filter (where j.status = 'succeeded'), 0)::bigint,
    count(*) filter (where j.status = 'succeeded' and j.lab_cost_is_actual),
    coalesce(sum(d.revenue) filter (where j.status = 'succeeded'), 0)::bigint,
    coalesce(sum(d.free) filter (where j.status = 'succeeded'), 0)::bigint
  from jobs j
  left join draw d on d.job_id = j.id
  where p_days is null or j.created_at > now() - make_interval(days => p_days)
  group by j.model_key
  order by 4 desc;
$$;

revoke execute on function public.model_margins(integer) from public, anon, authenticated;
grant execute on function public.model_margins(integer) to service_role;
