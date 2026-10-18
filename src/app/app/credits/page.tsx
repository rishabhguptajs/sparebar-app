import { headers } from "next/headers";
import { getProfile } from "@/lib/profile";
import { isIndia } from "@/lib/country";
import { CreditsView } from "@/components/credits-view";
import { env } from "@/lib/env";
import { getActivity, getBalance, getPayments, requireSession } from "@/lib/data";

export default async function CreditsPage() {
  const { supabase, user } = await requireSession();
  const [balance, payments, activity] = await Promise.all([getBalance(supabase, user.id), getPayments(supabase), getActivity(supabase)]);
  const profile = await getProfile(user.id, await headers());
  return (
    <CreditsView
      base="/app"
      balance={balance}
      region={profile.country ? (isIndia(profile.country) ? "IN" : "OTHER") : null}
      savedStateCode={profile.state_code}
      gstRegistered={env.gstRegistered()}
      sellerStateCode={env.sellerStateCode() ?? null}
      payments={payments}
      activity={activity}
      invoiceBase="/invoice"
    />
  );
}
