import type { Metadata } from "next";
import { Crumbs, SiteShell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { brand } from "@/config/brand";
import { abs, breadcrumbLd, graph, organizationLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Sparebar",
  description:
    "Sparebar (sparebar.xyz) is an AI UGC image and video generator. Learn what it does, who runs it and how to reach us.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <SiteShell>
      <JsonLd
        data={graph(
          organizationLd(),
          {
            "@type": "AboutPage",
            name: "About Sparebar",
            url: abs("/about"),
            isPartOf: { "@id": abs("/#website") },
          },
          breadcrumbLd([
            { name: "Sparebar", path: "/" },
            { name: "About", path: "/about" },
          ]),
        )}
      />
      <Crumbs trail={[{ name: "Sparebar", href: "/" }, { name: "About" }]} />
      <article className="mt-8 max-w-3xl">
        <h1 className="text-4xl font-light leading-[1.05] tracking-[-0.045em] sm:text-6xl">
          About Sparebar
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-2">
          Sparebar is an AI UGC image and video generator at {brand.domain}. You
          create a character once from photos or a description, then make photos
          and videos of that same person in any scene you can describe.
        </p>
        <p className="mt-4 leading-relaxed text-ink-2">
          The name is Sparebar, spelled S-P-A-R-E-B-A-R. It is not Spacebar.
        </p>
        <h2 className="mt-12 text-2xl font-light tracking-[-0.03em] sm:text-3xl">
          What it does
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-2">
          <li>
            Saves characters with up to three reference photos, or generates a
            portrait from a description.
          </li>
          <li>
            Runs more than 50 image and video models in one place, including
            Seedance, Kling, Veo, Wan, Nano Banana, Seedream and FLUX.
          </li>
          <li>
            Shows a fixed credit cost before every generation and refunds
            failures automatically.
          </li>
        </ul>
        <h2 className="mt-12 text-2xl font-light tracking-[-0.03em] sm:text-3xl">
          Who runs it
        </h2>
        <p className="mt-4 leading-relaxed text-ink-2">
          Sparebar is made by {brand.company.legalName} in{" "}
          {brand.company.country}. Write to{" "}
          <a
            className="text-ink underline underline-offset-4"
            href={`mailto:${brand.supportEmail}`}
          >
            {brand.supportEmail}
          </a>{" "}
          and we reply within 3 working days.
        </p>
      </article>
    </SiteShell>
  );
}
