-- Sparebar core schema: profiles, credit grants, append-only credit ledger, jobs.
-- Apply in the Supabase dashboard SQL editor (or `supabase db push` once the CLI is set up).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user). Also serves as the per-user lock row for credits.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Credit grants. Each purchase, plan renewal or free grant is its own row so it
-- can carry its own bucket, allowed generation kinds and expiry.
-- `remaining` is a cache kept in sync by the functions below; the ledger is the
-- source of truth.
-- ---------------------------------------------------------------------------
create table public.credit_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  bucket text not null check (bucket in ('paid', 'free')),
  allowed_kinds text[],                      -- null means every kind
  amount integer not null check (amount > 0),
  remaining integer not null check (remaining >= 0),
  expires_at timestamptz,                    -- null means never
  source text not null check (source in ('signup', 'pack', 'plan', 'admin', 'promo')),
  source_ref text not null unique,           -- payment id, 'signup:<user>', etc. Makes grants idempotent.
  created_at timestamptz not null default now()
);
create index credit_grants_user_idx on public.credit_grants (user_id);

-- ---------------------------------------------------------------------------
-- Jobs (one per generation request).
-- ---------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  character_id uuid,
  model_key text not null,
  lab text not null,
  kind text not null check (kind in ('image', 'video')),
  prompt text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  provider_ref text,                         -- lab operation / interaction id
  credits_charged integer not null check (credits_charged >= 0),
  lab_cost_micros bigint not null,           -- estimate at start, actual after settle when known
  lab_cost_is_actual boolean not null default false,
  outputs jsonb not null default '[]'::jsonb,-- [{ key, mime, bytes }]
  error text,
  poll_count integer not null default 0,
  next_poll_at timestamptz,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index jobs_user_created_idx on public.jobs (user_id, created_at desc);
create index jobs_running_idx on public.jobs (next_poll_at) where status = 'running';

-- ---------------------------------------------------------------------------
-- Credit ledger. Append-only. balance = sum(amount).
--   grant  +N   credits added
--   reserve -N  held when a job starts (one row per grant drawn from)
--   settle  0   job succeeded, reservation becomes final
--   refund +N   job failed, reservation returned to the same grant
--   expire -N   unused credits on an expired grant
-- ---------------------------------------------------------------------------
create table public.credit_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  grant_id uuid references public.credit_grants (id),
  job_id uuid references public.jobs (id),
  type text not null check (type in ('grant', 'reserve', 'settle', 'refund', 'expire')),
  amount integer not null,
  note text,
  created_at timestamptz not null default now()
);
create index credit_entries_user_idx on public.credit_entries (user_id, created_at desc);
create unique index credit_entries_job_grant_type_uq
  on public.credit_entries (job_id, grant_id, type) where job_id is not null and grant_id is not null;
create unique index credit_entries_job_settle_uq
  on public.credit_entries (job_id) where type = 'settle';

create or replace function public.forbid_ledger_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'credit_entries is append-only';
end;
$$;

create trigger credit_entries_append_only
  before update or delete on public.credit_entries
  for each row execute function public.forbid_ledger_mutation();

-- ---------------------------------------------------------------------------
-- Row level security: users read their own rows. All writes go through the
-- security definer functions below or the service role.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.credit_grants enable row level security;
alter table public.credit_entries enable row level security;
alter table public.jobs enable row level security;

create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "own grants" on public.credit_grants for select using (auth.uid() = user_id);
create policy "own entries" on public.credit_entries for select using (auth.uid() = user_id);
create policy "own jobs" on public.jobs for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Balance view helper.
-- ---------------------------------------------------------------------------
create or replace function public.credit_balance(p_user uuid, p_kind text default null, p_free_ok boolean default true)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(remaining), 0)::integer
  from credit_grants
  where user_id = p_user
    and remaining > 0
    and (expires_at is null or expires_at > now())
    and (p_kind is null or allowed_kinds is null or p_kind = any (allowed_kinds))
    and (p_free_ok or bucket <> 'free')
    -- Signed-in users may only read their own balance; the service role has no auth.uid().
    and (auth.uid() is null or auth.uid() = p_user);
$$;

-- ---------------------------------------------------------------------------
-- grant_credits: idempotent on source_ref. Returns the grant id.
-- ---------------------------------------------------------------------------
create or replace function public.grant_credits(
  p_user uuid,
  p_amount integer,
  p_bucket text,
  p_source text,
  p_source_ref text,
  p_allowed_kinds text[] default null,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant uuid;
begin
  perform 1 from profiles where id = p_user for update;
  if not found then
    raise exception 'unknown user %', p_user;
  end if;

  select id into v_grant from credit_grants where source_ref = p_source_ref;
  if found then
    return v_grant;
  end if;

  insert into credit_grants (user_id, bucket, allowed_kinds, amount, remaining, expires_at, source, source_ref)
  values (p_user, p_bucket, p_allowed_kinds, p_amount, p_amount, p_expires_at, p_source, p_source_ref)
  returning id into v_grant;

  insert into credit_entries (user_id, grant_id, type, amount, note)
  values (p_user, v_grant, 'grant', p_amount, p_source || ':' || p_source_ref);

  return v_grant;
end;
$$;

-- ---------------------------------------------------------------------------
-- start_job: inserts the job and reserves credits atomically.
-- Draws from grants that expire soonest first, so free credits are used before
-- paid ones. Raises 'insufficient_credits' if the balance for this kind is short,
-- in which case nothing is written.
-- ---------------------------------------------------------------------------
create or replace function public.start_job(
  p_user uuid,
  p_model_key text,
  p_lab text,
  p_kind text,
  p_prompt text,
  p_params jsonb,
  p_credits integer,
  p_lab_cost_micros bigint,
  p_free_ok boolean,
  p_character_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job uuid;
  v_need integer := p_credits;
  v_take integer;
  g record;
begin
  -- Per-user lock: serialises concurrent starts so balance cannot go negative.
  perform 1 from profiles where id = p_user for update;
  if not found then
    raise exception 'unknown user %', p_user;
  end if;

  if credit_balance(p_user, p_kind, p_free_ok) < p_credits then
    raise exception 'insufficient_credits';
  end if;

  insert into jobs (user_id, character_id, model_key, lab, kind, prompt, params, status,
                    credits_charged, lab_cost_micros)
  values (p_user, p_character_id, p_model_key, p_lab, p_kind, p_prompt, coalesce(p_params, '{}'::jsonb),
          'queued', p_credits, p_lab_cost_micros)
  returning id into v_job;

  for g in
    select id, remaining from credit_grants
    where user_id = p_user
      and remaining > 0
      and (expires_at is null or expires_at > now())
      and (allowed_kinds is null or p_kind = any (allowed_kinds))
      and (p_free_ok or bucket <> 'free')
    order by expires_at asc nulls last, created_at asc
    for update
  loop
    exit when v_need <= 0;
    v_take := least(g.remaining, v_need);
    update credit_grants set remaining = remaining - v_take where id = g.id;
    insert into credit_entries (user_id, grant_id, job_id, type, amount)
    values (p_user, g.id, v_job, 'reserve', -v_take);
    v_need := v_need - v_take;
  end loop;

  if v_need > 0 then
    raise exception 'insufficient_credits';
  end if;

  return v_job;
end;
$$;

-- ---------------------------------------------------------------------------
-- claim_job: short lease so the browser poll and the cron tick never advance
-- the same job at once. Returns the job row if claimed, nothing otherwise.
-- ---------------------------------------------------------------------------
create or replace function public.claim_job(p_job uuid, p_lease_seconds integer default 90)
returns setof public.jobs
language sql
security definer
set search_path = public
as $$
  update jobs
     set locked_until = now() + make_interval(secs => p_lease_seconds),
         updated_at = now()
   where id = p_job
     and status in ('queued', 'running')
     and (locked_until is null or locked_until < now())
  returning *;
$$;

-- ---------------------------------------------------------------------------
-- settle_job: marks success, records outputs and real lab cost. Idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.settle_job(
  p_job uuid,
  p_outputs jsonb,
  p_lab_cost_micros bigint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  j jobs%rowtype;
begin
  select * into j from jobs where id = p_job for update;
  if not found then
    raise exception 'unknown job %', p_job;
  end if;
  if j.status = 'succeeded' then
    return;
  end if;
  if j.status = 'failed' then
    raise exception 'job % already refunded', p_job;
  end if;

  update jobs
     set status = 'succeeded',
         outputs = coalesce(p_outputs, '[]'::jsonb),
         lab_cost_micros = coalesce(p_lab_cost_micros, lab_cost_micros),
         lab_cost_is_actual = p_lab_cost_micros is not null,
         locked_until = null,
         next_poll_at = null,
         completed_at = now(),
         updated_at = now()
   where id = p_job;

  insert into credit_entries (user_id, job_id, type, amount)
  values (j.user_id, p_job, 'settle', 0)
  on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- refund_job: marks failure and returns each reserved amount to its grant.
-- Idempotent. A refund onto an already expired grant is cleaned up by
-- expire_grants on its next run.
-- ---------------------------------------------------------------------------
create or replace function public.refund_job(p_job uuid, p_error text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  j jobs%rowtype;
  r record;
begin
  select * into j from jobs where id = p_job for update;
  if not found then
    raise exception 'unknown job %', p_job;
  end if;
  if j.status = 'failed' then
    return;
  end if;
  if j.status = 'succeeded' then
    raise exception 'job % already settled', p_job;
  end if;

  perform 1 from profiles where id = j.user_id for update;

  for r in
    select e.grant_id, -e.amount as amount
    from credit_entries e
    where e.job_id = p_job and e.type = 'reserve'
      and not exists (
        select 1 from credit_entries x
        where x.job_id = p_job and x.grant_id = e.grant_id and x.type = 'refund'
      )
  loop
    update credit_grants set remaining = remaining + r.amount where id = r.grant_id;
    insert into credit_entries (user_id, grant_id, job_id, type, amount, note)
    values (j.user_id, r.grant_id, p_job, 'refund', r.amount, left(p_error, 200));
  end loop;

  update jobs
     set status = 'failed',
         error = left(p_error, 2000),
         locked_until = null,
         next_poll_at = null,
         completed_at = now(),
         updated_at = now()
   where id = p_job;
end;
$$;

-- ---------------------------------------------------------------------------
-- expire_grants: zeroes unused credits on expired grants. Run from cron.
-- ---------------------------------------------------------------------------
create or replace function public.expire_grants()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  n integer := 0;
begin
  for g in
    select id, user_id, remaining from credit_grants
    where remaining > 0 and expires_at is not null and expires_at <= now()
    for update
  loop
    update credit_grants set remaining = 0 where id = g.id;
    insert into credit_entries (user_id, grant_id, type, amount)
    values (g.user_id, g.id, 'expire', -g.remaining);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Only the service role may call the write functions. Users may read their balance.
revoke execute on function public.grant_credits(uuid, integer, text, text, text, text[], timestamptz) from public, anon, authenticated;
revoke execute on function public.start_job(uuid, text, text, text, text, jsonb, integer, bigint, boolean, uuid) from public, anon, authenticated;
revoke execute on function public.claim_job(uuid, integer) from public, anon, authenticated;
revoke execute on function public.settle_job(uuid, jsonb, bigint) from public, anon, authenticated;
revoke execute on function public.refund_job(uuid, text) from public, anon, authenticated;
revoke execute on function public.expire_grants() from public, anon, authenticated;
revoke execute on function public.credit_balance(uuid, text, boolean) from public, anon;
grant execute on function public.credit_balance(uuid, text, boolean) to authenticated, service_role;
grant execute on function public.grant_credits(uuid, integer, text, text, text, text[], timestamptz) to service_role;
grant execute on function public.start_job(uuid, text, text, text, text, jsonb, integer, bigint, boolean, uuid) to service_role;
grant execute on function public.claim_job(uuid, integer) to service_role;
grant execute on function public.settle_job(uuid, jsonb, bigint) to service_role;
grant execute on function public.refund_job(uuid, text) to service_role;
grant execute on function public.expire_grants() to service_role;
