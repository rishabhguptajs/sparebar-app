import { useId } from "react";

// Generated artwork for a model tile. Every model gets its own picture, drawn from its key,
// so two models never look alike. The colours follow the maker so a family reads as a family.

const MAKER_HUE: Record<string, number> = {
  Google: 215,
  ByteDance: 175,
  Kling: 25,
  Alibaba: 265,
  xAI: 230,
  MiniMax: 335,
  Runway: 95,
  "Black Forest Labs": 195,
  HeyGen: 305,
  Recraft: 140,
  Sourceful: 50,
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A small seeded random source, so the same key always draws the same picture. */
function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

const hsl = (h: number, s: number, l: number, a = 1) =>
  `hsl(${Math.round(h) % 360} ${s}% ${l}% / ${a})`;

type Props = {
  modelKey: string;
  maker: string;
  kind: "image" | "video";
  className?: string;
};

export function ModelArt({ modelKey, maker, kind, className }: Props) {
  const id = useId().replace(/:/g, "");
  const r = rng(hash(modelKey));
  const base = MAKER_HUE[maker] ?? 200;
  const h1 = base + (r() - 0.5) * 50;
  const h2 = h1 + 40 + r() * 70;
  const accent = h1 + 150 + r() * 60;
  const angle = Math.round(r() * 360);

  // Four shapes placed from the seed. The mix of shape types is what tells models apart at a glance.
  const shapes = Array.from({ length: 4 }, (_, i) => {
    const kindOf = Math.floor(r() * 4);
    const x = 10 + r() * 120;
    const y = 6 + r() * 60;
    const size = 14 + r() * 34;
    const hue = i === 0 ? accent : i % 2 ? h2 : h1;
    const fill = hsl(hue, 80, 55 + r() * 25, 0.6 + r() * 0.35);
    switch (kindOf) {
      case 0:
        return <circle key={i} cx={x} cy={y} r={size / 2} fill={fill} />;
      case 1:
        return (
          <rect
            key={i}
            x={x - size / 2}
            y={y - size / 2}
            width={size}
            height={size * (0.5 + r())}
            rx={r() * size * 0.5}
            fill={fill}
            transform={`rotate(${Math.round(r() * 80 - 40)} ${x} ${y})`}
          />
        );
      case 2:
        return (
          <path
            key={i}
            d={`M${x - size} ${y} Q${x} ${y - size * (0.6 + r())} ${x + size} ${y} T${x + size * 2} ${y}`}
            fill="none"
            stroke={fill}
            strokeWidth={3 + r() * 5}
            strokeLinecap="round"
          />
        );
      default:
        return (
          <path
            key={i}
            d={`M${x} ${y - size / 2} L${x + size / 2} ${y + size / 2} L${x - size / 2} ${y + size / 2} Z`}
            fill={fill}
          />
        );
    }
  });

  return (
    <svg
      viewBox="0 0 140 70"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`g${id}`}
          gradientTransform={`rotate(${angle} .5 .5)`}
        >
          <stop offset="0" stopColor={hsl(h1, 85, 80)} />
          <stop offset="1" stopColor={hsl(h2, 80, 66)} />
        </linearGradient>
      </defs>
      <rect width="140" height="70" fill={`url(#g${id})`} />
      {shapes}
      {kind === "video" ? (
        // A row of frame ticks along the bottom marks a video model.
        <g fill={hsl(h1, 40, 25, 0.28)}>
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={4 + i * 10} y={64} width={6} height={3.5} rx={1} />
          ))}
        </g>
      ) : (
        // A thin frame marks an image model.
        <rect
          x="5"
          y="5"
          width="130"
          height="60"
          rx="6"
          fill="none"
          stroke={hsl(h1, 40, 25, 0.22)}
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
}
