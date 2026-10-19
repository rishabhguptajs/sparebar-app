-- Saved products (an advertiser's product kit) and saved outfits for a character.
-- Both are read by their owner and written through the server with the service role, like characters.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  pitch text not null default '' check (char_length(pitch) <= 200),
  photo_keys text[] not null default '{}' check (cardinality(photo_keys) <= 3),  -- R2 keys, first is the main photo
  label_key text,                                                              -- close up of the label or logo
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index products_user_idx on public.products (user_id, created_at desc) where deleted_at is null;
alter table public.products enable row level security;
create policy "own products" on public.products for select using (auth.uid() = user_id);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 200),
  photo_key text,                                                              -- optional photo of the outfit
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index outfits_character_idx on public.outfits (character_id, created_at desc) where deleted_at is null;
alter table public.outfits enable row level security;
create policy "own outfits" on public.outfits for select using (auth.uid() = user_id);
