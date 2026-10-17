-- Lab balances (entered by hand after each top-up), spend stats, and margin per model.

create table public.lab_balances (
  lab text primary key check (lab in ('google', 'xai', 'minimax', 'alibaba')),
  recorded boolean not null default false,           -- true once an admin has entered a balance
  balance_micros bigint not null default 0,          -- balance shown in the lab console when recorded
  recorded_at timestamptz not null default now(),
  low_runway_days numeric not null default 3 check (low_runway_days >= 0),
  low_floor_micros bigint not null default 5000000 check (low_floor_micros >= 0),  -- $5
  note text,
  last_alert_at timestamptz,
  last_alert_level text,
  billing_error_at timestamptz                       -- last time the lab refused a request over billing or quota
);
alter table public.lab_balances enable row level security;
-- No client policies: admin pages read this through the server.

-- Called when a lab rejects a request in a way that looks like an empty balance.
create or replace function public.note_lab_billing_error(p_lab text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into lab_balances (lab, balance_micros, billing_error_at)
  values (p_lab, 0, now())
  on conflict (lab) do update set billing_error_at = now();
$$;

-- Per lab: recorded balance, spend since it was recorded, and spend over the last 7 days.
-- Failed jobs are not counted as spend.
create or replace function public.lab_stats()
returns table (
  lab text,
  has_balance boolean,
  balance_micros bigint,
  recorded_at timestamptz,
  spent_since_micros bigint,
  spent_7d_micros bigint,
  first_job_at timestamptz,
  low_runway_days numeric,
  low_floor_micros bigint,
  last_alert_at timestamptz,
  last_alert_level text,
  billing_error_at timestamptz,
  note text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.lab,
    coalesce(b.recorded, false),
    coalesce(b.balance_micros, 0),
    b.recorded_at,
    coalesce(sum(j.lab_cost_micros) filter (where j.status <> 'failed' and b.recorded_at is not null and j.created_at > b.recorded_at), 0)::bigint,
    coalesce(sum(j.lab_cost_micros) filter (where j.status <> 'failed' and j.created_at > now() - interval '7 days'), 0)::bigint,
    min(j.created_at),
    coalesce(b.low_runway_days, 3),
    coalesce(b.low_floor_micros, 5000000),
    b.last_alert_at,
    b.last_alert_level,
    b.billing_error_at,
    b.note
  from (values ('google'), ('xai'), ('minimax'), ('alibaba')) as l (lab)
  left join lab_balances b on b.lab = l.lab
  left join jobs j on j.lab = l.lab
  group by l.lab, b.recorded, b.recorded_at, b.balance_micros, b.low_runway_days, b.low_floor_micros,
           b.last_alert_at, b.last_alert_level, b.billing_error_at, b.note;
$$;

-- Margin per model over the last p_days days (all time when null).
create or replace function public.model_margins(p_days integer default 30)
returns table (
  model_key text,
  ok_jobs bigint,
  failed_jobs bigint,
  credits bigint,
  lab_cost_micros bigint,
  actual_cost_jobs bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    j.model_key,
    count(*) filter (where j.status = 'succeeded'),
    count(*) filter (where j.status = 'failed'),
    coalesce(sum(j.credits_charged) filter (where j.status = 'succeeded'), 0)::bigint,
    coalesce(sum(j.lab_cost_micros) filter (where j.status = 'succeeded'), 0)::bigint,
    count(*) filter (where j.status = 'succeeded' and j.lab_cost_is_actual)
  from jobs j
  where p_days is null or j.created_at > now() - make_interval(days => p_days)
  group by j.model_key
  order by 4 desc;
$$;

revoke execute on function public.note_lab_billing_error(text) from public, anon, authenticated;
revoke execute on function public.lab_stats() from public, anon, authenticated;
revoke execute on function public.model_margins(integer) from public, anon, authenticated;
grant execute on function public.note_lab_billing_error(text) to service_role;
grant execute on function public.lab_stats() to service_role;
grant execute on function public.model_margins(integer) to service_role;
