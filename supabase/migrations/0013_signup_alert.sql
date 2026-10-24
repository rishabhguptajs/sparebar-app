-- Remember that the owner was told about a signup, so a repeated sign-in link never sends a second email.
-- Everyone who already has an account counts as told.

alter table public.profiles add column if not exists signup_notified_at timestamptz;
update public.profiles set signup_notified_at = now() where signup_notified_at is null;
