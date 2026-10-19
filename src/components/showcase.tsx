type Shot = { src: string; alt: string; label: string; ratio?: "tall" | "portrait" };

const TARA: Shot[] = [
  { src: "tara-cafe", alt: "Tara at a cafe table with an iced coffee", label: "Cafe" },
  { src: "tara-saree", alt: "Tara in a grey saree on a rainy balcony", label: "Monsoon saree" },
  { src: "tara-rain", alt: "Tara taking a selfie in the rain", label: "Rain selfie" },
  { src: "tara-skincare", alt: "Tara applying skincare in a bathroom mirror", label: "Skincare" },
  { src: "tara-night", alt: "Tara in front of city lights at night", label: "Night out" },
  { src: "tara-cafe-2", alt: "Tara resting her chin on her hand at a cafe", label: "Coffee break" },
  { src: "tara-yoga", alt: "Tara stretching on a yoga mat at home", label: "Yoga" },
  { src: "tara-closeup", alt: "Close up portrait of Tara", label: "Close up" },
];

const OTHERS: Shot[] = [
  { src: "riya-balcony", alt: "Riya drinking tea on a balcony", label: "Riya", ratio: "portrait" },
  { src: "riya-cafe", alt: "Riya at a cafe with a cold coffee", label: "Riya", ratio: "portrait" },
  { src: "riya-morning", alt: "Riya sitting on her bed in the morning", label: "Riya", ratio: "portrait" },
  { src: "meera", alt: "Portrait of Meera", label: "Meera", ratio: "portrait" },
  { src: "kabir", alt: "Portrait of Kabir", label: "Kabir", ratio: "portrait" },
];

function Tile({ shot }: { shot: Shot }) {
  const portrait = shot.ratio === "portrait";
  return (
    <figure className="relative overflow-hidden rounded-2xl bg-panel-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/showcase/${shot.src}.webp`}
        alt={shot.alt}
        width={720}
        height={portrait ? 960 : 1280}
        loading="lazy"
        decoding="async"
        className={`w-full object-cover ${portrait ? "aspect-[3/4] object-[50%_20%]" : "aspect-[9/16]"}`}
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2.5 pt-8 text-xs font-medium text-white">
        {shot.label}
      </figcaption>
    </figure>
  );
}

/** Real output from the app, so visitors can see what one character looks like across different scenes. */
export function Showcase() {
  return (
    <section id="examples" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-36">
        <h2 className="max-w-3xl text-4xl font-light leading-none tracking-[-0.045em] sm:text-6xl">Same face, every shot</h2>
        <p className="mt-5 max-w-xl text-ink-2">
          This is Tara, a character made in Sparebar from a short description and three portraits. Every photo below is a different scene, made with the same character.
        </p>

        <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TARA.map((s) => (
            <li key={s.src}>
              <Tile shot={s} />
            </li>
          ))}
        </ul>

        <h3 className="mt-20 text-2xl font-light tracking-[-0.03em] sm:text-3xl">Anyone you can describe</h3>
        <p className="mt-3 max-w-lg text-ink-2">Riya, Meera and Kabir were made the same way. Different looks, different people, each one kept consistent.</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {OTHERS.map((s) => (
            <li key={s.src}>
              <Tile shot={s} />
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-ink-2">All images are AI-generated in Sparebar. These people do not exist.</p>
      </div>
    </section>
  );
}
