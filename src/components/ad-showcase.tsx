import Link from "next/link";
import { TrackedVideo } from "@/components/tracked-video";

// Finished ads made in Sparebar: one character (Tara), four different products. The headline, badge and
// button on each are part of the generated image. Files live in /public/showcase.

const ADS = [
  { src: "ad-serum", alt: "Ad: Tara holding a vitamin C serum, headline Glow in 14 days", w: 720, h: 1281 },
  { src: "ad-bottle", alt: "Ad: Tara walking with a blue water bottle, 30 percent off this week only", w: 720, h: 900 },
  { src: "ad-coffee", alt: "Ad: Tara holding a coffee pouch, headline Better beans", w: 720, h: 900 },
];

const TUNE = ["Product", "Scene", "Outfit", "Headline and offer", "Photo or video", "Length and voice", "Model"];

// Tiles grow in proportion to their shape, so every ad ends up the same height whatever its ratio.
const tile = "min-w-[12rem] overflow-hidden rounded-2xl bg-panel-2 sm:min-w-0";
const grow = (ratio: number) => ({ flex: `${ratio} 1 0`, aspectRatio: String(ratio) });

export function AdShowcase() {
  return (
    <section id="ads" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-36">
        <h2 className="max-w-3xl text-4xl font-light leading-none tracking-[-0.045em] sm:text-6xl">Same Tara. Four different ads.</h2>
        <p className="mt-5 max-w-xl text-ink-2">
          One character, four products, a photo ad, an offer, an editorial and a talking video. Change anything you like and her face stays the same.
        </p>

        <div className="mt-14 flex gap-4 overflow-x-auto pb-2 sm:overflow-visible">
          {ADS.map((a) => (
            <div key={a.src} className={tile} style={grow(a.w / a.h)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/showcase/${a.src}.webp`} alt={a.alt} width={a.w} height={a.h} loading="lazy" decoding="async" className="size-full object-cover" />
            </div>
          ))}
          <div className={`${tile} relative`} style={grow(3 / 4)}>
            <TrackedVideo
              name="tara-lip-tint"
              src="/showcase/tara-lip-tint.mp4"
              poster="/showcase/tara-lip-tint-poster.webp"
              className="size-full object-cover"
              controls
              muted
              loop
              playsInline
              preload="none"
              aria-label="Video ad: Tara applying a lip tint and talking to the camera"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-2">Video: tap play, then turn the sound on.</p>

        <h3 className="mt-20 text-2xl font-light tracking-[-0.03em] sm:text-3xl">Tune any detail</h3>
        <p className="mt-3 max-w-xl text-ink-2">
          Every piece of an ad is yours to change, and the character stays consistent through all of it. Read how it works, with more examples.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {TUNE.map((t) => (
            <li key={t} className="rounded-full border border-line px-4 py-1.5 text-sm">
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/ai-product-ads" className="btn px-6 py-3 text-sm">
            How product ads work
          </Link>
          <Link href="/consistent-character-ai" className="btn-ghost px-6 py-3 text-sm">
            See the consistency
          </Link>
          <Link href="/features" className="btn-ghost px-6 py-3 text-sm">
            Every feature
          </Link>
        </div>

        <p className="mt-8 max-w-2xl text-sm text-ink-2">All of these ads were made in Sparebar. The people and products are AI-generated and do not exist.</p>
      </div>
    </section>
  );
}
