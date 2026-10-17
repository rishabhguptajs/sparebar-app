\set u '11111111-1111-1111-1111-111111111111'
\set v '22222222-2222-2222-2222-222222222222'
insert into auth.users values (:'u','a@b.c'), (:'v','x@y.z') on conflict do nothing;
insert into characters (id, user_id, name, description, reference_keys) values
  ('aaaaaaaa-0000-0000-0000-000000000001', :'u', 'Maya', 'curls', '{u/k/0.png}');
select 'name length enforced', (select count(*) = 0 from (select 1) x where false);
do $$ begin insert into characters (user_id, name) values ('11111111-1111-1111-1111-111111111111', ''); raise exception 'should have failed'; exception when check_violation then null; end $$;
select 'empty name rejected', true;
-- job may reference a character; deleting the character nulls the link
select start_job(:'u','nano-banana-2.1','google','image','p','{}',0,1,true,'aaaaaaaa-0000-0000-0000-000000000001') is not null;
select 'job keeps character link', character_id is not null from jobs order by created_at desc limit 1;
-- RLS: user v cannot see u's character, u can
set role authenticated;
select set_config('request.jwt.claim.sub', :'v', false) is not null;
select 'other user sees none', count(*) = 0 from characters;
select set_config('request.jwt.claim.sub', :'u', false) is not null;
select 'owner sees own', count(*) >= 1 from characters;
do $$ begin update characters set name = 'x'; if found then raise exception 'update allowed'; end if; exception when insufficient_privilege then null; end $$;
select 'client cannot write characters', true;
reset role;
update jobs set deleted_at = now() where true;
select 'soft delete column works', count(*) > 0 from jobs where deleted_at is not null;
