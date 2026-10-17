insert into auth.users values
  ('44444444-4444-4444-4444-444444444441','f1@x.co'),
  ('44444444-4444-4444-4444-444444444442','f2@x.co'),
  ('44444444-4444-4444-4444-444444444443','f3@x.co'),
  ('44444444-4444-4444-4444-444444444444','f4@x.co'),
  ('44444444-4444-4444-4444-444444444445','f5@x.co'),
  ('44444444-4444-4444-4444-444444444446','f6@x.co'),
  ('44444444-4444-4444-4444-444444444447','f7@x.co'),
  ('44444444-4444-4444-4444-444444444448','f8@x.co') on conflict do nothing;

select 'first claim is granted', claim_free_credits('44444444-4444-4444-4444-444444444441','f1@x.co','devA','ip1',2,14) = 'granted';
select 'free credits: 2, image only', credit_balance('44444444-4444-4444-4444-444444444441','image') = 2 and credit_balance('44444444-4444-4444-4444-444444444441','video') = 0;
select 'grant expires in 14 days', expires_at between now() + interval '13 days' and now() + interval '15 days' from credit_grants where source_ref = 'signup:44444444-4444-4444-4444-444444444441';
select 'same user again returns first outcome, no second grant', claim_free_credits('44444444-4444-4444-4444-444444444441','f1@x.co','devA','ip1',2,14) = 'granted';
select 'still 2 credits', credit_balance('44444444-4444-4444-4444-444444444441') = 2;
select 'same device is refused', claim_free_credits('44444444-4444-4444-4444-444444444442','f2@x.co','devA','ip2',2,14) = 'device_used';
select 'refused user has no credits', credit_balance('44444444-4444-4444-4444-444444444442') = 0;
select 'same normalized email on a new device is refused', claim_free_credits('44444444-4444-4444-4444-444444444443','f1@x.co','devB','ip3',2,14) = 'email_used';
select 'disposable is refused', claim_free_credits('44444444-4444-4444-4444-444444444444','f4@x.co','devC','ip4',2,14,3,true) = 'disposable';
select 'paused is refused', claim_free_credits('44444444-4444-4444-4444-444444444445','f5@x.co','devD','ip5',2,14,3,false,true) = 'paused';
-- IP limit of 2 in this test
select claim_free_credits('44444444-4444-4444-4444-444444444446','f6@x.co','devE','ipX',2,14,2) = 'granted';
select 'second from the same ip allowed', claim_free_credits('44444444-4444-4444-4444-444444444447','f7@x.co','devF','ipX',2,14,2) = 'granted';
select 'third from the same ip refused', claim_free_credits('44444444-4444-4444-4444-444444444448','f8@x.co','devG','ipX',2,14,2) = 'ip_limit';
select 'refused attempts are recorded', count(*) = 5 from free_grants where not granted;

select 'expired free credits are cleaned up', (select expire_grants()) >= 0;
set role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444441', false) is not null;
select 'clients see no free_grants rows (RLS, no policy)', count(*) = 0 from free_grants;
do $$ begin perform claim_free_credits('44444444-4444-4444-4444-444444444441','x','y','z',99,99); raise exception 'should have failed'; exception when insufficient_privilege then null; end $$;
select 'clients cannot claim directly', true;
reset role;
