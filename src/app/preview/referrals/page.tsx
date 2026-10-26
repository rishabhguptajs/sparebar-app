import { ReferralsView } from "@/components/referrals-view";

const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export default function PreviewReferrals() {
  return (
    <ReferralsView
      demo
      data={{
        code: "K7M2QX9A",
        link: "https://sparebar.xyz/?ref=K7M2QX9A",
        referred: 7,
        paying: 3,
        pendingCents: 640,
        availableCents: 2845,
        paidCents: 1900,
        minPayoutCents: 2000,
        minCreditPayoutCents: 500,
        creditsPerDollar: 12,
        openPayout: null,
        earnings: [
          { id: "e1", amountCents: 439, status: "active", availableAt: ago(-300), createdAt: ago(24), note: null },
          { id: "e2", amountCents: 517, status: "active", availableAt: ago(-100), createdAt: ago(60), note: null },
          { id: "e3", amountCents: 1850, status: "active", availableAt: ago(100), createdAt: ago(400), note: null },
          { id: "e4", amountCents: 586, status: "reversed", availableAt: ago(200), createdAt: ago(500), note: null },
        ],
        payouts: [{ id: "o1", amountCents: 1900, status: "paid", method: "upi", createdAt: ago(700) }],
      }}
    />
  );
}
