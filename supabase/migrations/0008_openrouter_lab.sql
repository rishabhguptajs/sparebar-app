-- OpenRouter is now the main lab. Models run through one OpenRouter account and balance.

alter table public.lab_balances drop constraint if exists lab_balances_lab_check;
alter table public.lab_balances add constraint lab_balances_lab_check
  check (lab in ('openrouter', 'google', 'xai', 'minimax', 'alibaba'));

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
  from (values ('openrouter'), ('google'), ('xai'), ('minimax'), ('alibaba')) as l (lab)
  left join lab_balances b on b.lab = l.lab
  left join jobs j on j.lab = l.lab
  group by l.lab, b.recorded, b.recorded_at, b.balance_micros, b.low_runway_days, b.low_floor_micros,
           b.last_alert_at, b.last_alert_level, b.billing_error_at, b.note;
$$;
