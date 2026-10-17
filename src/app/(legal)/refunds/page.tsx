import { LegalPage, Section } from "@/components/legal";
import { brand } from "@/config/brand";

export const metadata = { title: "Refund policy" };

export default function Refunds() {
  return (
    <LegalPage title="Refund policy" updated="18 October 2026">
      <Section title="Failed generations">
        <p>If an image or video fails to generate, the credits for it are returned to your balance automatically. You do not need to ask.</p>
      </Section>

      <Section title="Refunds for purchases">
        <ul>
          <li>You can ask for a refund within 7 days of a purchase if you have not spent any of the credits from it.</li>
          <li>If you have spent some of the credits, we can refund the unspent part only when something went wrong on our side, such as a repeated failure or a duplicate charge.</li>
          <li>Free credits are not refundable.</li>
        </ul>
      </Section>

      <Section title="Duplicate or wrong charges">
        <p>If you were charged twice, or charged an amount different from the one shown at checkout, tell us and we will refund the difference in full.</p>
      </Section>

      <Section title="How to ask">
        <p>
          Email <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> from the address on your account and include the invoice number. We reply within 3 working days.
        </p>
      </Section>

      <Section title="How refunds are paid">
        <p>
          Refunds go back to the payment method you used. Your bank decides how long it takes to show up, usually 5 to 10 working days. When a purchase is refunded, any credits from it that you have not spent are removed from your balance.
        </p>
      </Section>
    </LegalPage>
  );
}
