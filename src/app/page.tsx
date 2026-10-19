import { headers } from "next/headers";
import Link from "next/link";
import { brand } from "@/config/brand";
import { FAQ } from "@/config/faq";
import { FREE_TIER } from "@/config/free-tier";
import { MODEL_META } from "@/config/model-meta";
import { MODELS } from "@/config/models";
import { HeroDemo } from "@/components/hero-demo";
import { HeroField } from "@/components/hero-field";
import { Pricing } from "@/components/pricing";
import { countryFromHeaders, regionOf } from "@/lib/country";
import { env } from "@/lib/env";
import { creditsForModel } from "@/lib/credits";
import { getAdapter } from "@/lib/providers";
import { JsonLd } from "@/components/json-ld";
import { SITE, faqLd, graph, organizationLd, softwareLd, websiteLd } from "@/lib/seo";

const STEPS = [
  { title: "Create a character", body: "Upload photos, or describe the look and pick from three portraits. Add side and full body shots, outfits and products so they stay the same in every post." },
  { title: "Describe a shot", body: "Pick a post type, fill in a few details, and get a photo, a video or a set of product ads. The cost shows before you run it." },
  { title: "Download and post", body: "Your result lands in the library. Download it, or run it again with a small change." },
];

export const metadata = { title: { absolute: SITE.title }, alternates: { canonical: "/" } };

export default async function Home() {
  const region = regionOf(countryFromHeaders(await headers()));
  const models = MODELS.filter((m) => m.enabled && getAdapter(m.lab)).map((m) => ({
    key: m.key,
    label: m.label,
    kind: m.kind,
    credits: creditsForModel(m),
  }));

  // Only the best few of each kind. The full list lives on /models so the home page stays short.
  const top = (kind: "image" | "video") =>
    models
      .filter((m) => m.kind === kind)
      .sort((a, b) => (MODEL_META[a.key]?.rank ?? 99) - (MODEL_META[b.key]?.rank ?? 99))
      .slice(0, 3);
  const featured = [...top("video"), ...top("image")];

  return (
    <div className="landing min-h-dvh">
      <JsonLd data={graph(organizationLd(), websiteLd(), softwareLd(), faqLd())} />
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden">
        <HeroField light className="absolute inset-0 -z-10" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-10">
          <Link href="/" className="text-[17px] font-semibold tracking-[-0.03em]">
            {brand.name}
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm text-ink-2 sm:gap-2">
            <a href="#how" className="hidden px-3 py-2 transition-colors hover:text-ink sm:block">
              How it works
            </a>
            <a href="#pricing" className="hidden px-3 py-2 transition-colors hover:text-ink sm:block">
              Pricing
            </a>
            <a href="#faq" className="hidden px-3 py-2 transition-colors hover:text-ink sm:block">
              FAQ
            </a>
            <Link href="/login" className="btn-ghost px-4 py-2 text-ink">
              Sign in
            </Link>
          </nav>
        </header>

        <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-14 px-5 pb-16 pt-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-10">
          <div>
            <p className="inline-block rounded-full border border-line bg-white/60 px-3.5 py-1.5 text-sm backdrop-blur">
              AI UGC image and video generator
            </p>
            <h1 className="mt-6 text-[clamp(2.8rem,7vw,6.5rem)] font-light leading-[0.95] tracking-[-0.055em]">
              Make UGC with a character you own.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">
              Create a character once, type a scene, and get UGC style photos and videos with the same face every time.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="/login" className="btn px-7 py-3.5 text-[15px]">
                Start free
              </Link>
              <p className="text-sm text-ink-2">{FREE_TIER.credits} free credits. No card.</p>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroDemo imageCredits={models.find((m) => m.key === "nano-banana-2.1")?.credits ?? 2} />
          </div>
        </div>
      </section>

      <main>
        <section id="how" className="border-t border-line">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[1fr_2fr] lg:px-10 lg:py-36">
            <h2 className="text-4xl font-light leading-none tracking-[-0.045em] sm:text-6xl">How it works</h2>
            <ol className="divide-y divide-line border-y border-line">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid gap-3 py-8 sm:grid-cols-[3rem_1fr_1.4fr] sm:gap-6">
                  <p className="text-sm tabular-nums text-ink-2">{i + 1}</p>
                  <h3 className="text-xl tracking-[-0.02em]">{s.title}</h3>
                  <p className="leading-relaxed text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {models.length > 0 && (
          <section className="border-t border-line">
            <div className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-36">
              <h2 className="max-w-3xl text-4xl font-light leading-none tracking-[-0.045em] sm:text-6xl">Pick the model for the job</h2>
              <p className="mt-5 max-w-lg text-ink-2">Every model has a fixed credit cost, shown before you run it.</p>
              <ul className="mt-14 divide-y divide-line border-y border-line">
                {featured.map((m) => (
                  <li key={m.key} className="group flex items-baseline justify-between gap-4 py-6 transition-colors hover:bg-ink/[0.03]">
                    <p className="text-2xl font-light tracking-[-0.035em] sm:text-5xl">{m.label}</p>
                    <p className="text-right text-sm text-ink-2">
                      {m.kind === "image" ? "Image" : "Video"}, {m.credits} credits
                    </p>
                  </li>
                ))}
              </ul>
              <Link href="/models" className="btn-ghost mt-8 px-6 py-3 text-sm">
                See all {models.length} models
              </Link>
            </div>
          </section>
        )}

        <section id="pricing" className="border-t border-line">
          <div className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-36">
            <h2 className="text-4xl font-light leading-none tracking-[-0.045em] sm:text-6xl">Pricing</h2>
            <p className="mt-5 max-w-xl text-ink-2">
              Pay for credits, use them on any model. Failed generations are refunded. Paid credits do not expire.
            </p>

            <Pricing initialRegion={region} gstRegistered={env.gstRegistered()} />
          </div>
        </section>

        <section id="faq" className="border-t border-line">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[1fr_2fr] lg:px-10 lg:py-36">
            <h2 className="text-4xl font-light leading-none tracking-[-0.045em] sm:text-6xl">Questions</h2>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="text-2xl font-light text-ink-2 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-xl leading-relaxed text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden border-t border-line">
          <HeroField light seed={3} className="absolute inset-0 -z-10" />
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-10 px-5 py-28 lg:px-10 lg:py-44">
            <h2 className="max-w-4xl text-[clamp(3rem,9vw,8.5rem)] font-light leading-[0.92] tracking-[-0.055em]">Make the first one.</h2>
            <Link href="/login" className="btn px-7 py-3.5 text-[15px]">
              Start free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink-2 lg:px-10">
          <p>
            {brand.name} is made by{" "}
            {brand.company.legalName}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/refunds" className="hover:text-ink">
              Refunds
            </Link>
            <a href={`mailto:${brand.supportEmail}`} className="hover:text-ink">
              {brand.supportEmail}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
