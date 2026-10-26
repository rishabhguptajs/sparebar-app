-- When a refund empties a waiting payout, release the earnings still linked to it (other earnings, clawbacks)
-- so they join the next request, the same as settle_payout does on a rejection.
create or replace function public.reverse_referral_earning(p_payment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e referral_earnings%rowtype;
  po referral_payouts%rowtype;
begin
  select e2.* into e
    from referral_earnings e2
    join payments p on p.id = e2.payment_id
   where p.provider_payment_id = p_payment_id and e2.status = 'active'
   for update of e2;
  if not found then return; end if;

  update referral_earnings set status = 'reversed' where id = e.id;

  if e.payout_id is null then return; end if;
  select * into po from referral_payouts where id = e.payout_id for update;
  if po.status = 'paid' then
    insert into referral_earnings (referrer_id, referred_id, amount_cents, available_at, note)
    values (e.referrer_id, e.referred_id, -e.amount_cents, now(), 'refund after payout');
  elsif po.status = 'requested' then
    if po.amount_cents - e.amount_cents <= 0 then
      update referral_payouts set status = 'rejected', note = 'every earning in it was refunded', settled_at = now(), amount_cents = 0 where id = po.id;
      update referral_earnings set payout_id = null where payout_id = po.id and id <> e.id;
    else
      update referral_payouts set amount_cents = amount_cents - e.amount_cents where id = po.id;
    end if;
  end if;
end;
$$;
