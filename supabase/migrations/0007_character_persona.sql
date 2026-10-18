-- Persona for a character: what they post about and how they sound. Used by templates and the post kit.
alter table public.characters
  add column if not exists niche text not null default '' check (char_length(niche) <= 80),
  add column if not exists tone text not null default '' check (char_length(tone) <= 80);
