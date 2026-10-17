import Link from "next/link";
import { brand } from "@/config/brand";
import { FREE_TIER } from "@/config/free-tier";
import { MODELS } from "@/config/models";
import { PACKS, PLANS, perCredit } from "@/config/plans";
import { HeroStrip } from "@/components/hero-strip";
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

export default function Home() {
  const models = MODELS.filter((m) => m.enabled && getAdapter(m.lab)).map((m) => ({
    key: m.key,
    label: m.label,
    kind: m.kind,
    credits: creditsForModel(m),
  }));

  return (
    <div className="landing min-h-dvh">
      <section className="relative overflow-hidden pb-10">
        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
          <Link href="/" className="wide text-xl tracking-tight">
            {brand.name}
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-3">
            <a href="#how" className="hidden px-3 py-2 hover:underline sm:block">
              How it works
            </a>
            <a href="#pricing" className="hidden px-3 py-2 hover:underline sm:block">
              Pricing
            </a>
            <a href="#faq" className="hidden px-3 py-2 hover:underline sm:block">
              FAQ
            </a>
            <Link href="/login" className="px-3 py-2 font-medium hover:underline">
              Sign in
            </Link>
          </nav>
        </header>

        <div className="relative mt-2 sm:mt-4">
          <HeroStrip />
          <h1 className="wide ghost pointer-events-none relative z-10 mx-auto mt-2 max-w-7xl whitespace-nowrap px-5 text-[clamp(2.4rem,9vw,10rem)] leading-[0.88] tracking-[-0.04em] lg:px-10">
            One face.
            <br />
            Every shot.
          </h1>
        </div>

        <div className="relative z-10 mx-auto mt-10 flex max-w-7xl flex-wrap items-end justify-between gap-6 px-5 lg:px-10">
          <p className="max-w-md text-lg leading-relaxed">
            Make a character once. Then put them in any scene you can describe, as a UGC style image or a video, with the same face every time.
          </p>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Link href="/login" className="btn px-8 py-4 text-lg">
              Start free
            </Link>
            <p className="text-sm text-ink-2">{FREE_TIER.credits} free credits. No card needed.</p>
          </div>
        </div>
      </section>

      <main>
        <section id="how" className="border-t-2 border-ink">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-10 lg:py-28">
            <h2 className="wide text-4xl leading-none tracking-tight sm:text-5xl">How it works</h2>
            <ol className="divide-y divide-ink/30 border-y border-ink/30">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid gap-2 py-7 sm:grid-cols-[4rem_1fr_1.4fr] sm:gap-6">
                  <p className="wide text-3xl text-accent">{i + 1}</p>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="leading-relaxed text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {models.length > 0 && (
          <section className="border-t-2 border-ink bg-ink text-bg">
            <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
              <h2 className="wide max-w-3xl text-4xl leading-none tracking-tight sm:text-5xl">Pick the model for the job</h2>
              <p className="mt-4 max-w-lg opacity-70">Every model has a fixed credit cost, shown before you run it.</p>
              <ul className="mt-12 divide-y divide-bg/20 border-y border-bg/20">
                {models.map((m) => (
                  <li key={m.key} className="flex items-baseline justify-between gap-4 py-5">
                    <p className="wide text-2xl tracking-tight sm:text-4xl">{m.label}</p>
                    <p className="text-right text-sm opacity-70">
                      {m.kind === "image" ? "Image" : "Video"} · {m.credits} credits
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section id="pricing" className="border-t-2 border-ink">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
            <h2 className="wide text-4xl leading-none tracking-tight sm:text-5xl">Pricing</h2>
            <p className="mt-4 max-w-xl text-ink-2">
              Pay for credits, use them on any model. Failed generations are refunded. Paid credits do not expire.
            </p>

            <ul className="mt-12 grid gap-px border-2 border-ink bg-ink md:grid-cols-3">
              {PLANS.map((p) => (
                <li key={p.key} className="flex flex-col bg-bg p-7">
                  <h3 className="font-medium">{p.label}</h3>
                  <p className="wide mt-6 text-6xl tabular-nums tracking-tight">${p.priceUsdCents / 100}</p>
                  <p className="mt-1 text-sm text-ink-2">per month</p>
                  <p className="mt-6 font-semibold">{p.credits} credits</p>
                  <p className="text-sm text-ink-2">${perCredit(p).toFixed(3)} per credit</p>
                  <Link href="/login" className="btn mt-8 px-4 py-3 text-center text-sm">
                    Start with {p.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-2">Plans are paid month by month. Buy again when you want another month of credits.</p>

            <h3 className="wide mt-16 text-2xl tracking-tight">Or top up when you need to</h3>
            <ul className="mt-5 divide-y divide-ink/30 border-y border-ink/30">
              {PACKS.map((p) => (
                <li key={p.key} className="flex items-baseline justify-between gap-4 py-4">
                  <p>
                    <span className="font-semibold">{p.credits} credits</span>
                    <span className="ml-3 text-sm text-ink-2">${perCredit(p).toFixed(3)} per credit</span>
                  </p>
                  <p className="wide text-2xl tabular-nums">${p.priceUsdCents / 100}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-2">Prices are in US dollars. From India, you pay in rupees with 18% GST added.</p>
          </div>
        </section>

        <section id="faq" className="border-t-2 border-ink">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-10 lg:py-28">
            <h2 className="wide text-4xl leading-none tracking-tight sm:text-5xl">Questions</h2>
            <div className="divide-y divide-ink/30 border-y border-ink/30">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-lg font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="text-2xl transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 max-w-xl leading-relaxed text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t-2 border-ink bg-accent text-accent-ink">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 px-5 py-20 lg:px-10 lg:py-28">
            <h2 className="wide max-w-4xl text-[clamp(2.8rem,9vw,8rem)] leading-[0.88] tracking-[-0.04em]">Make the first one.</h2>
            <Link href="/login" className="btn px-8 py-4 text-lg" style={{ boxShadow: "5px 5px 0 0 var(--bg)" }}>
              Start free
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-bg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm lg:px-10">
          <p>
            {brand.name} is made by{" "}
            <a href={brand.company.site} className="underline">
              {brand.company.legalName}
            </a>
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/refunds" className="hover:underline">
              Refunds
            </Link>
            <a href={`mailto:${brand.supportEmail}`} className="hover:underline">
              {brand.supportEmail}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
