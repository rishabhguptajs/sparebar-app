-- Free tier: one signup grant per person, with device, email and IP checks.

create table public.free_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  email_norm text not null,
  device_hash text not null,
  ip_hash text,
  granted boolean not null,
  reason text not null check (reason in ('granted', 'device_used', 'email_used', 'ip_limit', 'disposable', 'paused')),
  created_at timestamptz not null default now()
);
create index free_grants_device_idx on public.free_grants (device_hash) where granted;
create index free_grants_email_idx on public.free_grants (email_norm) where granted;
create index free_grants_ip_idx on public.free_grants (ip_hash, created_at) where granted;

alter table public.free_grants enable row level security;
-- No client policies: only the server reads or writes this table.

-- claim_free_credits: decides and records the outcome, and grants the credits when allowed.
-- Safe to call again for the same user: the first outcome stands.
create or replace function public.claim_free_credits(
  p_user uuid,
  p_email_norm text,
  p_device_hash text,
  p_ip_hash text,
  p_amount integer,
  p_expires_days integer,
  p_ip_limit integer default 3,
  p_disposable boolean default false,
  p_paused boolean default false
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing free_grants%rowtype;
  verdict text := 'granted';
begin
  -- Serialise claims from the same device or email so two tabs cannot both pass the checks.
  perform pg_advisory_xact_lock(hashtext('free:' || p_device_hash));
  perform pg_advisory_xact_lock(hashtext('free:' || p_email_norm));

  select * into existing from free_grants where user_id = p_user;
  if found then
    return existing.reason;
  end if;

  if p_paused then
    verdict := 'paused';
  elsif p_disposable then
    verdict := 'disposable';
  elsif exists (select 1 from free_grants where granted and device_hash = p_device_hash) then
    verdict := 'device_used';
  elsif exists (select 1 from free_grants where granted and email_norm = p_email_norm) then
    verdict := 'email_used';
  elsif p_ip_hash is not null
    and (select count(*) from free_grants
         where granted and ip_hash = p_ip_hash and created_at > now() - interval '24 hours') >= p_ip_limit then
    verdict := 'ip_limit';
  end if;

  insert into free_grants (user_id, email_norm, device_hash, ip_hash, granted, reason)
  values (p_user, p_email_norm, p_device_hash, p_ip_hash, verdict = 'granted', verdict);

  if verdict = 'granted' then
    perform grant_credits(
      p_user, p_amount, 'free', 'signup', 'signup:' || p_user,
      array['image'], now() + make_interval(days => p_expires_days)
    );
  end if;

  return verdict;
end;
$$;

revoke execute on function public.claim_free_credits(uuid, text, text, text, integer, integer, integer, boolean, boolean) from public, anon, authenticated;
grant execute on function public.claim_free_credits(uuid, text, text, text, integer, integer, integer, boolean, boolean) to service_role;
