-- Structured look for a character (age, skin tone, hair and so on) and a role for each reference photo.
-- profile is one JSON object so fields can be added without a migration. Old characters keep '{}' and
-- still work from their free text description.
-- reference_tags runs parallel to reference_keys: 'photo' (uploaded), 'front', 'angle' or 'full'.
alter table public.characters
  add column if not exists profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object'),
  add column if not exists reference_tags text[] not null default '{}';
