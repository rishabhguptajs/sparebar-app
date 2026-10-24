import { CreditsView } from "@/components/credits-view";

const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export default function PreviewCredits() {
  return (
    <CreditsView
      base="/preview"
      balance={38}
      demo
      payments={[{ id: "p1", product_key: "starter", credits: 150, total_minor: 1500, status: "paid", created_at: ago(60 * 30) }]}
      activity={[
        { id: 4, type: "refund", amount: 27, note: null, created_at: ago(40) },
        { id: 3, type: "reserve", amount: -27, note: null, created_at: ago(44) },
        { id: 2, type: "grant", amount: 150, note: "plan:pay:pay_1", created_at: ago(60 * 30) },
        { id: 1, type: "grant", amount: 2, note: "signup:abc", created_at: ago(60 * 31) },
      ]}
    />
  );
}
