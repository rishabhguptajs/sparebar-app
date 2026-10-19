import { LegalPage, Section } from "@/components/legal";
import { brand } from "@/config/brand";

export const metadata = { title: "Refund policy" };

export default function Refunds() {
  return (
    <LegalPage title="Refund policy" updated="19 October 2026">
      <Section title="Failed generations">
        <p>If an image or video fails to generate, the credits for it are returned to your balance automatically. You do not need to ask.</p>
      </Section>

      <Section title="Purchases are not refundable">
        <p>Credits, plans and packs are not refundable once bought. We do not refund because you changed your mind, did not like a result, or have credits left over. Free credits are never refundable.</p>
        <p>We make an exception only when something is wrong on our side:</p>
        <ul>
          <li>A model or the service stopped working and we could not deliver what you paid for. We refund the unspent part, or add the credits back to your balance if you prefer.</li>
          <li>You were charged twice, or charged an amount different from the one shown at checkout.</li>
          <li>We close your account without a breach of the terms. We refund your unused purchased credits.</li>
        </ul>
        <p>We decide each request on its merits. Credits already spent on generations that worked are not refunded.</p>
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
