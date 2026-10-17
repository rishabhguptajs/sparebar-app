import Link from "next/link";
import { brand } from "@/config/brand";
import { FREE_TIER } from "@/config/free-tier";
import { MODELS } from "@/config/models";
import { PACKS, PLANS, perCredit } from "@/config/plans";
import { HeroField } from "@/components/hero-field";
import { creditsForModel } from "@/lib/credits";
import { getAdapter } from "@/lib/providers";

const STEPS = [
  { title: "Create a character", body: "Upload up to three photos, or describe someone and we make a portrait. Save it with a name." },
  { title: "Describe a shot", body: "Pick a character, write the scene, choose an image or a video, and set the shape. The cost shows before you run it." },
  { title: "Download and post", body: "Your result lands in the library. Download it, or run it again with a small change." },
];

const FAQ = [
  {
    q: "What is a credit?",
    a: `Credits pay for generations. Each model shows its cost before you run it. An image on the lowest tier costs 2 credits. You get ${FREE_TIER.credits} free credits on signup, enough for one image. They work for images only and expire in ${FREE_TIER.expiresDays} days.`,
  },
  { q: "What if a generation fails?", a: "The credits come back to your balance automatically. You do not need to ask." },
  {
    q: "Can I use photos of real people?",
    a: "Only with their permission. The terms do not allow content that shows a real person without consent, or that is meant to deceive others about who someone is.",
  },
  { q: "Do credits expire?", a: "Credits you buy do not expire. Free credits do." },
  {
    q: "How do I pay?",
    a: "By card. Prices are in US dollars. If you pay from India you are charged in rupees with 18% GST added, and every payment comes with an invoice.",
  },
  { q: "Who sees my photos?", a: "Your photos are used to make what you ask for and are sent to the model provider you choose for that. The privacy policy lists who processes your data." },
];

const FACTS = [
  { title: "Images and video", body: "Photos and short clips from the same character." },
  { title: "Priced up front", body: "Every model shows its credit cost before you run it." },
  { title: "Refunded on failure", body: "A failed generation returns its credits on its own." },
];

export default function Home() {
  const models = MODELS.filter((m) => m.enabled && getAdapter(m.lab)).map((m) => ({
    key: m.key,
    label: m.label,
    kind: m.kind,
    credits: creditsForModel(m),
  }));

  return (
    <div className="landing min-h-dvh">
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden">
        <HeroField className="absolute inset-0 -z-10" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-10">
          <Link href="/" className="text-[17px] font-medium tracking-[-0.03em]">
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
            <Link href="/login" className="px-3 py-2 text-ink transition-colors hover:text-ink-2">
              Sign in
            </Link>
          </nav>
        </header>

        <div className="mx-auto mt-auto w-full max-w-7xl px-5 pb-10 pt-24 lg:px-10">
          <h1 className="text-[clamp(3.2rem,11.5vw,11rem)] font-light leading-[0.9] tracking-[-0.06em]">
            One face.
            <br />
            Every shot.
          </h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
            <p className="max-w-sm text-[17px] leading-relaxed text-ink-2">
              Make a character once. Put them in any scene you can describe, as a UGC style image or a video, with the same face every time.
            </p>
            <div className="flex items-center gap-5">
              <Link href="/login" className="btn px-7 py-3.5 text-[15px]">
                Start free
              </Link>
              <p className="text-sm text-ink-2">{FREE_TIER.credits} free credits. No card.</p>
            </div>
          </div>

          <dl className="mt-14 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.title}>
                <dt className="text-sm font-medium">{f.title}</dt>
                <dd className="mt-1 max-w-[16rem] text-sm leading-relaxed text-ink-2">{f.body}</dd>
              </div>
            ))}
          </dl>
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
                {models.map((m) => (
                  <li key={m.key} className="group flex items-baseline justify-between gap-4 py-6 transition-colors hover:bg-white/[0.02]">
                    <p className="text-2xl font-light tracking-[-0.035em] sm:text-5xl">{m.label}</p>
                    <p className="text-right text-sm text-ink-2">
                      {m.kind === "image" ? "Image" : "Video"}, {m.credits} credits
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section id="pricing" className="border-t border-line">
          <div className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-36">
            <h2 className="text-4xl font-light leading-none tracking-[-0.045em] sm:text-6xl">Pricing</h2>
            <p className="mt-5 max-w-xl text-ink-2">
              Pay for credits, use them on any model. Failed generations are refunded. Paid credits do not expire.
            </p>

            <ul className="mt-14 grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
              {PLANS.map((p) => (
                <li key={p.key} className="flex flex-col py-8 md:px-8 md:first:pl-0 md:last:pr-0">
                  <h3 className="text-sm text-ink-2">{p.label}</h3>
                  <p className="mt-6 text-7xl font-light tabular-nums tracking-[-0.06em]">${p.priceUsdCents / 100}</p>
                  <p className="mt-1 text-sm text-ink-2">per month</p>
                  <p className="mt-8">{p.credits} credits</p>
                  <p className="text-sm text-ink-2">${perCredit(p).toFixed(3)} per credit</p>
                  <Link href="/login" className="btn-ghost mt-8 px-4 py-3 text-center text-sm">
                    Start with {p.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-2">Plans are paid month by month. Buy again when you want another month of credits.</p>

            <h3 className="mt-20 text-2xl font-light tracking-[-0.03em]">Or top up when you need to</h3>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {PACKS.map((p) => (
                <li key={p.key} className="flex items-baseline justify-between gap-4 py-5">
                  <p>
                    {p.credits} credits
                    <span className="ml-4 text-sm text-ink-2">${perCredit(p).toFixed(3)} per credit</span>
                  </p>
                  <p className="text-2xl font-light tabular-nums tracking-[-0.03em]">${p.priceUsdCents / 100}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-2">Prices are in US dollars. From India, you pay in rupees with 18% GST added.</p>
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
          <HeroField seed={3} className="absolute inset-0 -z-10" />
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
            <a href={brand.company.site} className="underline underline-offset-4 hover:text-ink">
              {brand.company.legalName}
            </a>
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
