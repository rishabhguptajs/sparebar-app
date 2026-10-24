import { LegalPage, Section } from "@/components/legal";
import { brand } from "@/config/brand";

export const metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="18 October 2026">
      <Section title="Summary">
        <p>
          {brand.name} is run by {brand.company.legalName}, based in {brand.company.country}. We collect what we need to sign you in, generate your content, take payment and keep the service safe. We do not sell your data.
        </p>
      </Section>

      <Section title="What we collect">
        <ul>
          <li><strong>Account:</strong> your email address.</li>
          <li><strong>Payments:</strong> your name, email, country, plus the amount paid and receipt details. Card details go to Dodo Payments and never reach us.</li>
          <li><strong>Your content:</strong> prompts, the photos you upload for characters, and the images and videos generated for you.</li>
          <li><strong>Usage:</strong> which models you use, credits spent, and basic technical logs such as errors and request times.</li>
        </ul>
      </Section>

      <Section title="Photos of people">
        <p>
          Reference photos are used only to generate content you ask for. They are sent to the AI provider for the model you choose, so that it can keep the same face across results. Only upload photos of people who have agreed to it.
        </p>
      </Section>

      <Section title="Who processes your data">
        <p>We use these providers to run the service:</p>
        <ul>
          <li>Supabase for sign in and our database.</li>
          <li>Cloudflare for storing your generated media and uploads.</li>
          <li>Google, and any other AI provider whose model you choose, to generate content from your prompts and photos.</li>
          <li>Dodo Payments for payments.</li>
          <li>Our hosting provider for serving the app.</li>
        </ul>
        <p>These providers may process data outside your country. Each has its own privacy terms.</p>
      </Section>

      <Section title="Why we use it">
        <p>To provide the service you asked for, to take and record payments as the law requires, to prevent abuse such as repeated free credit claims, and to answer your support requests.</p>
      </Section>

      <Section title="Cookies">
        <p>We use cookies to keep you signed in. We do not use advertising cookies.</p>
      </Section>

      <Section title="Analytics">
        <p>
          With your permission we use PostHog to see how people use Sparebar: which pages are visited, where visitors come from, which buttons are clicked and which features are used. This is set by the banner you see on your first visit, and you can change your choice by clearing this site&apos;s data in your browser. We do not record your screen, and we do not send the photos or prompts you create to PostHog.
        </p>
        <p>
          We also use Vercel Analytics, which counts visits and pages without cookies or personal data. Our servers send PostHog a small record when something happens in the service, such as signing in, starting a generation, running out of credits or buying credits. We use this only to improve the product and never sell it.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your account and content until you ask us to delete them. Payment records are kept for as long as tax law requires. Removing an item from your library hides it from you.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can ask us to give you a copy of your data, correct it, or delete it by writing to <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>. We will reply within 30 days.
        </p>
      </Section>

      <Section title="Children">
        <p>{brand.name} is for people aged 18 and over. We do not knowingly collect data from children.</p>
      </Section>

      <Section title="Changes">
        <p>We will post changes here and, if they matter, tell you in the app or by email.</p>
      </Section>
    </LegalPage>
  );
}
