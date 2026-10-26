-- Referrals: a referrer earns a share of what the people they refer pay, for a limited time.
-- Earnings are credited in USD cents and paid out by hand; Dodo has no payout API.

alter table public.profiles
  add column referral_code text unique,
  add column referred_by uuid references public.profiles (id) on delete set null,
  add column referred_at timestamptz,
  add column referral_expires_at timestamptz,
  add constraint profiles_not_self_referred check (referred_by is null or referred_by <> id);
create index profiles_referred_by_idx on public.profiles (referred_by) where referred_by is not null;

alter table public.payments
  add column discount_code text,
  add column discount_cents integer not null default 0;

create table public.referral_payouts (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  method text not null check (method in ('upi', 'bank', 'wise', 'credits')),
  destination text not null,
  status text not null default 'requested' check (status in ('requested', 'paid', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index referral_payouts_referrer_idx on public.referral_payouts (referrer_id, created_at desc);
create index referral_payouts_open_idx on public.referral_payouts (created_at) where status = 'requested';

-- One row per referred payment. A negative amount with no payment is a clawback for a refund after payout.
create table public.referral_earnings (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid references public.profiles (id) on delete set null,
  payment_id uuid unique references public.payments (id) on delete set null,
  amount_cents integer not null check (amount_cents <> 0),
  status text not null default 'active' check (status in ('active', 'reversed')),
  available_at timestamptz not null,
  payout_id uuid references public.referral_payouts (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index referral_earnings_referrer_idx on public.referral_earnings (referrer_id, created_at desc);

alter table public.referral_payouts enable row level security;
alter table public.referral_earnings enable row level security;
create policy "own payouts" on public.referral_payouts for select using (auth.uid() = referrer_id);
create policy "own earnings" on public.referral_earnings for select using (auth.uid() = referrer_id);

-- attach_referrer: locks the referrer onto a new account. Returns 'attached' or the reason it did not.
-- Only accounts made in the last day with no purchases can be attached, and never to someone who shares
-- the device or network they signed up from.
create or replace function public.attach_referrer(p_user uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me profiles%rowtype;
  ref_id uuid;
  mine free_grants%rowtype;
begin
  select * into me from profiles where id = p_user for update;
  if not found then return 'unknown_user'; end if;
  if me.referred_by is not null then return 'already_attached'; end if;
  if me.created_at < now() - interval '1 day' then return 'not_new'; end if;
  if exists (select 1 from payments where user_id = p_user and status in ('paid', 'refunded')) then return 'has_paid'; end if;

  select id into ref_id from profiles where referral_code = upper(p_code);
  if ref_id is null then return 'unknown_code'; end if;
  if ref_id = p_user then return 'self'; end if;

  select * into mine from free_grants where user_id = p_user;
  if found and exists (
    select 1 from free_grants f
     where f.user_id = ref_id
       and (f.device_hash = mine.device_hash or (mine.ip_hash is not null and f.ip_hash = mine.ip_hash))
  ) then
    return 'same_device';
  end if;

  update profiles set referred_by = ref_id, referred_at = now() where id = p_user;
  return 'attached';
end;
$$;

-- record_referral_earning: called after a payment is fulfilled. Safe to repeat for the same payment.
-- The share is taken from what the buyer paid after the fee, so a discounted first purchase earns less.
create or replace function public.record_referral_earning(
  p_payment_id text,
  p_share numeric,
  p_fee numeric,
  p_window_months integer,
  p_hold_days integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  pay payments%rowtype;
  buyer profiles%rowtype;
  cents integer;
begin
  select * into pay from payments where provider_payment_id = p_payment_id and status = 'paid';
  if not found then return 0; end if;

  select * into buyer from profiles where id = pay.user_id for update;
  if buyer.referred_by is null then return 0; end if;

  if exists (select 1 from referral_earnings where payment_id = pay.id) then return 0; end if;

  if buyer.referral_expires_at is null then
    buyer.referral_expires_at := now() + make_interval(months => p_window_months);
    update profiles set referral_expires_at = buyer.referral_expires_at where id = buyer.id;
  end if;
  if now() > buyer.referral_expires_at then return 0; end if;

  cents := floor(pay.total_minor * (1 - p_fee) * p_share);
  if cents <= 0 then return 0; end if;

  insert into referral_earnings (referrer_id, referred_id, payment_id, amount_cents, available_at)
  values (buyer.referred_by, buyer.id, pay.id, cents, now() + make_interval(days => p_hold_days));
  return cents;
end;
$$;

-- reverse_referral_earning: called when a payment is refunded. If the earning is already paid out, the amount
-- is taken off the referrer's next payout instead.
create or replace function public.reverse_referral_earning(p_payment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e referral_earnings%rowtype;
  po referral_payouts%rowtype;
begin
  select e2.* into e
    from referral_earnings e2
    join payments p on p.id = e2.payment_id
   where p.provider_payment_id = p_payment_id and e2.status = 'active'
   for update of e2;
  if not found then return; end if;

  update referral_earnings set status = 'reversed' where id = e.id;

  if e.payout_id is null then return; end if;
  select * into po from referral_payouts where id = e.payout_id for update;
  if po.status = 'paid' then
    insert into referral_earnings (referrer_id, referred_id, amount_cents, available_at, note)
    values (e.referrer_id, e.referred_id, -e.amount_cents, now(), 'refund after payout');
  elsif po.status = 'requested' then
    if po.amount_cents - e.amount_cents <= 0 then
      update referral_payouts set status = 'rejected', note = 'every earning in it was refunded', settled_at = now(), amount_cents = 0 where id = po.id;
    else
      update referral_payouts set amount_cents = amount_cents - e.amount_cents where id = po.id;
    end if;
  end if;
end;
$$;

-- request_payout: bundles everything available into one payout. Cash payouts wait for you to pay by hand;
-- a credits payout is granted at once, at p_credits_per_dollar. Raises 'below_minimum' if it is too little
-- and 'payout_open' if a cash payout is already waiting.
create or replace function public.request_payout(
  p_user uuid,
  p_method text,
  p_destination text,
  p_min_cents integer,
  p_credits_per_dollar numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
  pid uuid;
  n_credits integer;
begin
  perform 1 from profiles where id = p_user for update;
  if exists (select 1 from referral_payouts where referrer_id = p_user and status = 'requested') then
    raise exception 'payout_open';
  end if;

  select coalesce(sum(amount_cents), 0) into total
    from referral_earnings
   where referrer_id = p_user and status = 'active' and payout_id is null and available_at <= now();
  if total < p_min_cents or total <= 0 then raise exception 'below_minimum'; end if;

  insert into referral_payouts (referrer_id, amount_cents, method, destination)
  values (p_user, total, p_method, p_destination)
  returning id into pid;

  update referral_earnings set payout_id = pid
   where referrer_id = p_user and status = 'active' and payout_id is null and available_at <= now();

  if p_method = 'credits' then
    n_credits := floor(total / 100.0 * p_credits_per_dollar);
    perform grant_credits(p_user, n_credits, 'paid', 'referral', 'refpay:' || pid);
    update referral_payouts
       set status = 'paid', settled_at = now(), destination = n_credits || ' credits'
     where id = pid;
  end if;
  return pid;
end;
$$;

-- settle_payout: admin marks a payout paid or rejected. Rejecting frees its earnings for the next request.
create or replace function public.settle_payout(p_payout uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('paid', 'rejected') then raise exception 'bad status'; end if;
  update referral_payouts
     set status = p_status, note = p_note, settled_at = now()
   where id = p_payout and status = 'requested';
  if not found then raise exception 'payout not open'; end if;
  if p_status = 'rejected' then
    update referral_earnings set payout_id = null where payout_id = p_payout;
  end if;
end;
$$;

revoke execute on function public.attach_referrer(uuid, text) from public, anon, authenticated;
revoke execute on function public.record_referral_earning(text, numeric, numeric, integer, integer) from public, anon, authenticated;
revoke execute on function public.reverse_referral_earning(text) from public, anon, authenticated;
revoke execute on function public.request_payout(uuid, text, text, integer, numeric) from public, anon, authenticated;
revoke execute on function public.settle_payout(uuid, text, text) from public, anon, authenticated;
grant execute on function public.attach_referrer(uuid, text) to service_role;
grant execute on function public.record_referral_earning(text, numeric, numeric, integer, integer) to service_role;
grant execute on function public.reverse_referral_earning(text) to service_role;
grant execute on function public.request_payout(uuid, text, text, integer, numeric) to service_role;
grant execute on function public.settle_payout(uuid, text, text) to service_role;
