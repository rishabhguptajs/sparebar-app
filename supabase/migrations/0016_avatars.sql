-- Premade avatars: a shared library a brand picks from. Picking one copies it into the brand's own characters,
-- so it works everywhere a character does. Rows stay inactive until the portraits have been reviewed.

create table public.avatars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 60),
  gender text not null check (gender in ('woman', 'man')),
  niches text[] not null default '{}',
  tagline text not null default '',
  description text not null default '' check (char_length(description) <= 1000),
  look text not null default '',
  tone text not null default '' check (char_length(tone) <= 80),
  profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object'),
  reference_keys text[] not null default '{}',  -- R2 keys under avatars/<slug>/, first one is the cover
  reference_tags text[] not null default '{}',  -- parallel to reference_keys: 'front', 'angle', 'full'
  brand_count integer not null default 0,       -- how many brands picked it
  active boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index avatars_active_idx on public.avatars (sort, name) where active;

-- Read and written through the server with the service role, like characters.
alter table public.avatars enable row level security;

alter table public.characters
  add column if not exists avatar_id uuid references public.avatars (id) on delete set null;
create index characters_avatar_idx on public.characters (avatar_id) where avatar_id is not null;

create or replace function public.bump_avatar_brands(p_avatar uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update avatars set brand_count = brand_count + 1 where id = p_avatar;
$$;

revoke execute on function public.bump_avatar_brands(uuid) from public, anon, authenticated;
grant execute on function public.bump_avatar_brands(uuid) to service_role;
