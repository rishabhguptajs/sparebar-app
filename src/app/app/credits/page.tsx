import { CreditsView } from "@/components/credits-view";
import { env } from "@/lib/env";
import { getActivity, getBalance, getPayments, requireSession } from "@/lib/data";

export default async function CreditsPage() {
  const { supabase, user } = await requireSession();
  const [balance, payments, activity] = await Promise.all([getBalance(supabase, user.id), getPayments(supabase), getActivity(supabase)]);
  return (
    <CreditsView
      base="/app"
      balance={balance}
      inrPerUsd={env.inrPerUsd() ?? null}
      sellerStateCode={env.sellerStateCode() ?? null}
      payments={payments}
      activity={activity}
      invoiceBase="/invoice"
    />
  );
}
