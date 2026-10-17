import Link from "next/link";
import { brand } from "@/config/brand";
import { FREE_TIER } from "@/config/free-tier";
import { MODELS } from "@/config/models";
import { PACKS, PLANS, perCredit } from "@/config/plans";
import { art } from "@/lib/art";
import { creditsForModel } from "@/lib/credits";
import { getAdapter } from "@/lib/providers";

// Frames that show one figure in different scenes. They are illustrations, not product output.
const FRAMES = [
  { seed: 4, caption: "Unboxing at a bright bathroom counter", tilt: "-rotate-3 translate-y-4" },
  { seed: 9, caption: "Coffee run, golden hour", tilt: "translate-y-0" },
  { seed: 15, caption: "Mirror selfie in the hallway", tilt: "rotate-3 translate-y-6" },
];

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
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          {brand.name}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-2">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-ink-2 hover:text-ink sm:block">
            How it works
          </a>
          <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-ink-2 hover:text-ink sm:block">
            Pricing
          </a>
          <a href="#faq" className="hidden rounded-lg px-3 py-2 text-ink-2 hover:text-ink sm:block">
            FAQ
          </a>
          <Link href="/login" className="rounded-lg px-3 py-2 font-medium hover:bg-panel">
            Sign in
          </Link>
          <Link href="/login" className="rounded-xl bg-accent px-4 py-2 font-semibold text-accent-ink">
            Start free
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:px-8 lg:pb-28 lg:pt-16">
          <div>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              One character. Every shot.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">
              Create a character once, then make UGC style images and videos with the same face in any scene you can describe.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-ink">
                Start free
              </Link>
              <a href="#pricing" className="rounded-xl px-5 py-3.5 text-base font-medium hover:bg-panel">
                See pricing
              </a>
            </div>
            <p className="mt-4 text-sm text-ink-2">
              {FREE_TIER.credits} free credits when you sign up. No card needed.
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-md justify-center gap-3 pb-8 sm:max-w-lg" aria-hidden="true">
            {FRAMES.map((f) => (
              <div
                key={f.seed}
                className={`relative aspect-[9/16] w-1/3 overflow-hidden rounded-[22px] border border-line shadow-[0_24px_48px_-24px_rgb(0_0_0/0.45)] ${f.tilt}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={art(f.seed, "9:16")} alt="" className="size-full object-cover" />
                <p className="absolute inset-x-2 bottom-3 rounded-lg bg-black/55 px-2 py-1.5 text-[11px] font-medium leading-tight text-white backdrop-blur-sm">
                  {f.caption}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="border-y border-line bg-panel/50">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <p className="font-display text-5xl font-semibold text-accent">{i + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {models.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Pick the model for the job</h2>
            <p className="mt-3 max-w-lg text-ink-2">Every model has a fixed credit cost, shown before you run it.</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((m) => (
                <li key={m.key} className="flex items-center justify-between gap-4 rounded-2xl bg-panel px-5 py-4">
                  <div>
                    <p className="font-medium">{m.label}</p>
                    <p className="text-sm text-ink-2">{m.kind === "image" ? "Image" : "Video"}</p>
                  </div>
                  <p className="text-sm tabular-nums text-ink-2">{m.credits} credits</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="pricing" className="border-y border-line bg-panel/50">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h2>
            <p className="mt-3 max-w-xl text-ink-2">
              Pay for credits, use them on any model. Failed generations are refunded. Paid credits do not expire.
            </p>

            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <li key={p.key} className="flex flex-col rounded-3xl bg-panel p-7">
                  <h3 className="text-sm font-medium text-ink-2">{p.label}</h3>
                  <p className="mt-3 font-display text-5xl font-semibold tabular-nums">${p.priceUsdCents / 100}</p>
                  <p className="mt-1 text-sm text-ink-2">per month</p>
                  <p className="mt-5 font-medium">{p.credits} credits</p>
                  <p className="text-sm text-ink-2">${perCredit(p).toFixed(3)} per credit</p>
                  <Link href="/login" className="mt-6 rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-ink">
                    Start with {p.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-2">Plans are paid month by month. Buy again when you want another month of credits.</p>

            <h3 className="mt-12 font-display text-xl font-semibold">Or top up when you need to</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {PACKS.map((p) => (
                <li key={p.key} className="flex items-center justify-between rounded-2xl bg-panel px-5 py-4">
                  <div>
                    <p className="font-medium">{p.credits} credits</p>
                    <p className="text-sm text-ink-2">${perCredit(p).toFixed(3)} per credit</p>
                  </div>
                  <p className="font-display text-2xl font-semibold tabular-nums">${p.priceUsdCents / 100}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-2">
              Prices are in US dollars. From India, you pay in rupees with 18% GST added.
            </p>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-5 py-16 lg:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Questions</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="text-xl text-ink-2 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
          <div className="rounded-[2rem] bg-panel px-6 py-14 text-center sm:px-12">
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Make your first shot</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-2">Sign in with your email and use your free credits on an image.</p>
            <Link href="/login" className="mt-8 inline-block rounded-xl bg-accent px-7 py-3.5 text-base font-semibold text-accent-ink">
              Start free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink-2 lg:px-8">
          <p>
            {brand.name} is made by{" "}
            <a href={brand.company.site} className="underline hover:text-ink">
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
