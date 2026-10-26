import { notFound } from "next/navigation";
import { ReferralsLoader } from "@/components/loaders";
import { referralEnabled } from "@/config/referral";

export default function ReferralsPage() {
  if (!referralEnabled()) notFound();
  return <ReferralsLoader />;
}
