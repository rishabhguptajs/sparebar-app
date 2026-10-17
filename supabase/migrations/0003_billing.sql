-- Payments, GST invoice numbering and idempotent fulfillment.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_key text not null,
  kind text not null check (kind in ('plan', 'pack')),
  credits integer not null check (credits > 0),
  currency text not null check (currency in ('USD', 'INR')),
  base_minor bigint not null check (base_minor > 0),       -- price before GST, in cents or paise
  gst_minor bigint not null default 0 check (gst_minor >= 0),
  total_minor bigint not null check (total_minor > 0),
  cgst_minor bigint not null default 0,
  sgst_minor bigint not null default 0,
  igst_minor bigint not null default 0,
  -- customer snapshot used on the invoice
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  in_india boolean not null,
  state_code text,                                          -- GST state code, India only
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'refunded')),
  invoice_no text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz,
  check (total_minor = base_minor + gst_minor)
);
create index payments_user_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;
create policy "own payments" on public.payments for select using (auth.uid() = user_id);

-- Consecutive invoice numbers per Indian financial year (April to March).
-- Format SB/26-27/000001 stays within the 16 character GST limit.
create table public.invoice_counters (
  fy text primary key,
  last_no integer not null default 0
);
alter table public.invoice_counters enable row level security;

create or replace function public.next_invoice_no(p_at timestamptz default now())
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  local_ts timestamp := p_at at time zone 'Asia/Kolkata';
  start_year integer := case when extract(month from local_ts) >= 4 then extract(year from local_ts)::integer else extract(year from local_ts)::integer - 1 end;
  fy_label text := lpad((start_year % 100)::text, 2, '0') || '-' || lpad(((start_year + 1) % 100)::text, 2, '0');
  n integer;
begin
  insert into invoice_counters as c (fy, last_no) values (fy_label, 1)
  on conflict (fy) do update set last_no = c.last_no + 1
  returning last_no into n;
  return 'SB/' || fy_label || '/' || lpad(n::text, 6, '0');
end;
$$;

-- fulfill_payment: marks the payment paid, issues the invoice number and grants
-- the credits, all in one transaction. Safe to call again for the same payment.
create or replace function public.fulfill_payment(p_order_id text, p_payment_id text)
returns table (user_id uuid, credits integer, already boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  pay payments%rowtype;
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
  return query select pay.user_id, pay.credits, false;
end;
$$;

create or replace function public.fail_payment(p_order_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update payments set status = 'failed' where razorpay_order_id = p_order_id and status = 'created';
$$;

-- refund_payment: after a refund is issued in Razorpay, mark it and take back any
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
  select * into pay from payments where razorpay_payment_id = p_payment_id for update;
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

revoke execute on function public.next_invoice_no(timestamptz) from public, anon, authenticated;
revoke execute on function public.fulfill_payment(text, text) from public, anon, authenticated;
revoke execute on function public.fail_payment(text) from public, anon, authenticated;
revoke execute on function public.refund_payment(text) from public, anon, authenticated;
grant execute on function public.next_invoice_no(timestamptz) to service_role;
grant execute on function public.fulfill_payment(text, text) to service_role;
grant execute on function public.fail_payment(text) to service_role;
grant execute on function public.refund_payment(text) to service_role;
