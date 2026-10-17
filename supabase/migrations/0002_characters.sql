-- Characters (reusable looks) and soft delete for jobs.

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 1000),
  reference_keys text[] not null default '{}',  -- R2 keys, first one is the cover
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index characters_user_idx on public.characters (user_id, created_at desc) where deleted_at is null;

alter table public.characters enable row level security;
create policy "own characters" on public.characters for select using (auth.uid() = user_id);

-- Writes to characters go through the server with the service role.

alter table public.jobs add column deleted_at timestamptz;
alter table public.jobs
  add constraint jobs_character_fk foreign key (character_id) references public.characters (id) on delete set null;
create index jobs_library_idx on public.jobs (user_id, created_at desc) where deleted_at is null;
