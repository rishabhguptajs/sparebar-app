-- Switch the payment provider from Razorpay to Dodo Payments. Dodo is the merchant of record: it
-- collects tax, issues the receipt and takes the buyer's details, so the GST, state, phone and
-- invoice numbering we kept ourselves is removed.

alter table public.payments rename column razorpay_order_id to checkout_session_id;
alter table public.payments rename column razorpay_payment_id to provider_payment_id;
alter table public.payments
  drop column gst_minor,        -- also drops the total = base + gst check
  drop column cgst_minor,
  drop column sgst_minor,
  drop column igst_minor,
  drop column customer_phone,
  drop column in_india,
  drop column state_code,
  drop column invoice_no;
alter table public.profiles drop column if exists state_code;

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
  select * into pay from payments where checkout_session_id = p_order_id for update;
  if not found then
    raise exception 'unknown order %', p_order_id;
  end if;

  if pay.status in ('paid', 'refunded') then
    return query select pay.user_id, pay.credits, true;
    return;
  end if;

  update payments
     set status = 'paid',
         provider_payment_id = p_payment_id,
         paid_at = now()
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

drop function if exists public.next_invoice_no(timestamptz);
drop table if exists public.invoice_counters;

create or replace function public.fail_payment(p_order_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update payments set status = 'failed' where checkout_session_id = p_order_id and status = 'created';
$$;

revoke execute on function public.fail_payment(text) from public, anon, authenticated;
grant execute on function public.fail_payment(text) to service_role;

-- refund_payment: after a refund is issued in Dodo, mark it and take back any
-- credits from that purchase that have not been spent.
create or replace function public.refund_payment(p_payment_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  pay payments%rowtype;
  g credit_grants%rowtype;
  taken integer := 0;
begin
  select * into pay from payments where provider_payment_id = p_payment_id for update;
  if not found then
    return 0;
  end if;
  if pay.status = 'refunded' then
    return 0;
  end if;

  perform 1 from profiles where id = pay.user_id for update;
  select * into g from credit_grants where source_ref = 'pay:' || p_payment_id for update;
  if found and g.remaining > 0 then
    taken := g.remaining;
    update credit_grants set remaining = 0 where id = g.id;
    insert into credit_entries (user_id, grant_id, type, amount, note)
    values (pay.user_id, g.id, 'expire', -taken, 'refunded payment');
  end if;

  update payments set status = 'refunded', refunded_at = now() where id = pay.id;
  return taken;
end;
$$;

revoke execute on function public.refund_payment(text) from public, anon, authenticated;
grant execute on function public.refund_payment(text) to service_role;
