-- Profile details collected at sign-in: name, country, and the GST state used for rupee payments.
-- Country is detected from the request when the user signs in, then used to pick the payment region.

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists country text,        -- ISO 3166 alpha-2, 'ZZ' when the user says they are outside India and it is not known
  add column if not exists state_code text;     -- GST state code, for buyers in India

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;
