import { LegalPage, Section } from "@/components/legal";
import { brand } from "@/config/brand";

export const metadata = { title: "Terms of service" };

export default function Terms() {
  const who = brand.company.legalName;
  return (
    <LegalPage title="Terms of service" updated="18 October 2026">
      <Section title="Who we are">
        <p>
          {brand.name} is operated by {who} ({brand.company.site.replace("https://", "")}). In these terms, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean {who}. You can reach us at{" "}
          <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
        </p>
      </Section>

      <Section title="The service">
        <p>
          {brand.name} lets you create characters and generate images and videos from text prompts and reference photos. Generation is carried out by third party AI providers, so what is available can change as providers change their models or prices.
        </p>
        <p>You must be at least 18 years old to use the service.</p>
      </Section>

      <Section title="Your account">
        <p>You sign in with your email address. You are responsible for what happens under your account. Tell us if you think someone else has access to it.</p>
      </Section>

      <Section title="Credits and payments">
        <ul>
          <li>Generations cost credits. The cost of each model is shown before you generate.</li>
          <li>Credits have no cash value, cannot be transferred, and cannot be exchanged for money except as set out in the <a href="/refunds">refund policy</a>.</li>
          <li>Monthly plans are paid month by month and are not renewed automatically. Credit packs are one time purchases. Credits you buy do not expire.</li>
          <li>Free credits are for images only and expire. We may limit free credits to one grant per person.</li>
          <li>If a generation fails, the credits for it are returned automatically.</li>
          <li>Payments are processed by Razorpay. Prices are in US dollars. Payments from India are charged in Indian rupees with 18% GST added. We issue an invoice for every payment.</li>
        </ul>
      </Section>

      <Section title="Your content">
        <p>
          You keep the rights you have in your prompts, uploaded photos and the images and videos generated for you. You give us permission to store, process and display that content as needed to run the service for you, including sending it to the AI providers that carry out your request.
        </p>
        <p>
          AI output can be wrong, can look like other work, and may not be protected by copyright in every country. You are responsible for how you use what you generate.
        </p>
      </Section>

      <Section title="What you must not do">
        <ul>
          <li>Upload or generate content that shows a real person without their permission, or that is meant to deceive others about who someone is.</li>
          <li>Create sexual content involving anyone under 18, or any content that exploits or endangers children.</li>
          <li>Create content that is unlawful, that harasses or threatens people, or that infringes someone else&rsquo;s rights.</li>
          <li>Present generated media as genuine footage of real events.</li>
          <li>Try to get around credit limits, abuse free credits, or interfere with the service or its providers.</li>
          <li>Break the usage rules of the AI providers we use. They apply to what you create here.</li>
        </ul>
        <p>We may refuse a request, remove content, or suspend an account that breaks these rules. Credits spent on content we remove for a breach are not refunded.</p>
      </Section>

      <Section title="Availability">
        <p>
          We work to keep the service running but do not promise it will always be available. Providers may have outages, and a generation can fail. When that happens the credits are returned.
        </p>
      </Section>

      <Section title="Ending your use">
        <p>You can stop using {brand.name} at any time. We can suspend or close an account that breaks these terms. If we close your account without a breach, we will refund unused purchased credits.</p>
      </Section>

      <Section title="Liability">
        <p>
          The service is provided as is. To the extent the law allows, we are not liable for indirect or consequential loss, and our total liability for any claim is limited to the amount you paid us in the three months before it.
        </p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of India. Courts in India have jurisdiction, subject to any consumer rights you have where you live.</p>
      </Section>

      <Section title="Changes">
        <p>We may update these terms. If a change matters, we will tell you in the app or by email before it applies. Using the service after a change means you accept it.</p>
      </Section>
    </LegalPage>
  );
}
