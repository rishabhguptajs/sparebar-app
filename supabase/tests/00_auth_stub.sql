do $$ begin create role anon; create role authenticated; create role service_role; exception when duplicate_object then null; end $$;
create schema auth;
grant usage on schema auth to authenticated, anon;
grant usage on schema public to authenticated, anon;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
-- Supabase grants table access to these roles by default; RLS then filters rows.
alter default privileges in schema public grant select on tables to authenticated, anon;
