"use client";

import { useEffect, useId, useRef } from "react";

// One illustrated figure in seven scenes. The scenes are drawings, not product output.
// Every frame is melted by a displacement filter until the pointer (or a slow sweep) pulls it into focus.

const INK = "#0b1519";
const SKIN = "#c98a68";
const MARK = "#ff2f7e";

type Scene = { caption: string; sky: [string, string]; shirt: string; backdrop: React.ReactNode };

const SCENES: Scene[] = [
  {
    caption: "Bathroom counter, flash on",
    sky: ["#dfeaec", "#9fc3c8"],
    shirt: "#ff2f7e",
    backdrop: (
      <g stroke="#7aa3a9" strokeWidth="1.2" fill="none" opacity=".8">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${i * 24} 0V320M0 ${i * 24}H180`} />
        ))}
        <rect x="108" y="236" width="42" height="84" fill="#f4fafb" stroke="none" />
      </g>
    ),
  },
  {
    caption: "Golden hour on the drive home",
    sky: ["#ffe48a", "#ff8a3d"],
    shirt: "#0e6e6b",
    backdrop: (
      <g>
        <circle cx="132" cy="132" r="44" fill="#fff3c4" />
        <path d="M0 214C40 196 90 206 180 190V320H0Z" fill="#c4542a" />
      </g>
    ),
  },
  {
    caption: "Mirror selfie, hallway",
    sky: ["#c9bcff", "#6a56d6"],
    shirt: "#f4d35e",
    backdrop: (
      <g>
        <rect x="14" y="30" width="84" height="196" rx="42" fill="#e6e0ff" opacity=".8" />
        <rect x="14" y="30" width="84" height="196" rx="42" fill="none" stroke={INK} strokeWidth="3" />
      </g>
    ),
  },
  {
    caption: "Coffee run, window seat",
    sky: ["#f3e3d0", "#d1a77c"],
    shirt: "#1b2a6b",
    backdrop: (
      <g fill="#fff8ee" stroke={INK} strokeWidth="2.5">
        <rect x="14" y="26" width="152" height="130" />
        <path d="M90 26V156M14 91H166" fill="none" />
        <rect x="118" y="214" width="34" height="40" rx="4" fill="#fff" />
      </g>
    ),
  },
  {
    caption: "Unboxing on the bed",
    sky: ["#fbd1de", "#e5688f"],
    shirt: "#9fe3c5",
    backdrop: (
      <g>
        <ellipse cx="46" cy="246" rx="62" ry="40" fill="#fff0f4" />
        <ellipse cx="140" cy="262" rx="52" ry="32" fill="#ffd0de" />
        <rect x="104" y="196" width="58" height="46" fill="#ff2f7e" transform="rotate(-8 133 219)" />
      </g>
    ),
  },
  {
    caption: "Night market",
    sky: ["#1b2a6b", "#0b1019"],
    shirt: "#ff6b3d",
    backdrop: (
      <g>
        {[18, 52, 96, 134, 160].map((x, i) => (
          <circle key={x} cx={x} cy={46 + (i % 2) * 24} r="9" fill="#ffd36e" opacity=".9" />
        ))}
        <path d="M0 110H180" stroke="#ffd36e" strokeWidth="1.5" strokeDasharray="3 6" />
      </g>
    ),
  },
  {
    caption: "Gym floor, mid set",
    sky: ["#bfe9d6", "#3f9c86"],
    shirt: "#0b1519",
    backdrop: (
      <g fill="#0b1519" opacity=".85">
        <rect x="12" y="150" width="156" height="8" />
        <rect x="12" y="132" width="9" height="44" />
        <rect x="159" y="132" width="9" height="44" />
      </g>
    ),
  },
];

function Figure({ shirt }: { shirt: string }) {
  return (
    <g>
      <path d="M14 320C14 246 52 220 90 220C128 220 166 246 166 320Z" fill={shirt} />
      <rect x="80" y="188" width="20" height="40" fill={SKIN} />
      <ellipse cx="90" cy="158" rx="30" ry="38" fill={SKIN} />
      <path d="M57 152C52 108 76 96 94 96C120 96 134 118 124 154C114 132 98 126 80 128C69 132 63 141 57 152Z" fill={INK} />
      <circle cx="60.5" cy="170" r="4" fill={MARK} />
    </g>
  );
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function HeroStrip() {
  const uid = useId().replace(/:/g, "");
  const strip = useRef<HTMLDivElement>(null);
  const frames = useRef<(HTMLDivElement | null)[]>([]);
  const disp = useRef<(SVGFEDisplacementMapElement | null)[]>([]);
  const turb = useRef<(SVGFETurbulenceElement | null)[]>([]);
  const caps = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, active: false, last: 0 };
    const focus = SCENES.map(() => 0);
    let slide = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.last = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    function frame(t: number) {
      const el = strip.current;
      if (!el) return;
      const parent = el.parentElement!.getBoundingClientRect();
      const overflow = Math.max(0, el.scrollWidth - parent.width);
      if (pointer.active && t - pointer.last > 3500) pointer.active = false;

      // Without a pointer, a slow sweep walks the focus along the strip.
      const sweep = 0.5 + 0.5 * Math.sin(t / 3200);
      const px = pointer.active ? pointer.x : parent.left + sweep * parent.width;
      const py = pointer.active ? pointer.y : parent.top + parent.height * 0.5;
      const along = pointer.active ? clamp((pointer.x - parent.left) / parent.width, 0, 1) : sweep;
      slide += (-overflow * along - slide) * 0.06;
      el.style.transform = `translate3d(${slide.toFixed(1)}px,0,0)`;

      frames.current.forEach((f, i) => {
        if (!f) return;
        const r = f.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), (py - (r.top + r.height / 2)) * 0.5);
        const target = clamp(1 - d / (r.width * 1.5), 0, 1);
        focus[i] += (target - focus[i]) * 0.1;
        const k = focus[i];
        const melt = 46 * (1 - k) ** 1.5 + 2 + 4 * Math.sin(t / 900 + i);
        disp.current[i]?.setAttribute("scale", melt.toFixed(1));
        const wob = 0.0085 + 0.003 * Math.sin(t / 1700 + i * 1.7);
        turb.current[i]?.setAttribute("baseFrequency", `${wob.toFixed(4)} ${(wob * 2.6).toFixed(4)}`);
        f.style.transform = `scale(${(1 + 0.07 * k).toFixed(3)})`;
        const c = caps.current[i];
        if (c) c.style.opacity = String(clamp((k - 0.45) * 2.2, 0, 1));
      });
      if (!still) raf = requestAnimationFrame(frame);
    }

    if (still) {
      focus.fill(0.2);
      frame(0);
    } else {
      raf = requestAnimationFrame(frame);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="overflow-hidden" aria-hidden="true">
      <div ref={strip} className="flex w-max items-start gap-5 pl-[6vw] pr-[6vw] will-change-transform sm:gap-7">
        {SCENES.map((s, i) => {
          const id = `${uid}-${i}`;
          return (
            <div
              key={s.caption}
              className="relative"
              style={{ marginTop: `${[0, 3.2, 0.8, 4.6, 1.4, 3.8, 0.4][i]}rem` }}
            >
              <div
                ref={(n) => {
                  frames.current[i] = n;
                }}
                className="aspect-[9/16] w-[clamp(8.5rem,13vw,13rem)] origin-bottom overflow-hidden rounded-[10px] shadow-[8px_8px_0_0_var(--ink)] will-change-transform"
              >
                <svg viewBox="0 0 180 320" className="size-full" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={s.sky[0]} />
                      <stop offset="1" stopColor={s.sky[1]} />
                    </linearGradient>
                    <filter id={`${id}-f`} x="-20%" y="-20%" width="140%" height="140%">
                      <feTurbulence
                        ref={(n) => {
                          turb.current[i] = n;
                        }}
                        type="fractalNoise"
                        baseFrequency="0.0085 0.022"
                        numOctaves="2"
                        seed={i * 7 + 3}
                        result="n"
                      />
                      <feDisplacementMap
                        ref={(n) => {
                          disp.current[i] = n;
                        }}
                        in="SourceGraphic"
                        in2="n"
                        scale="40"
                        xChannelSelector="R"
                        yChannelSelector="G"
                      />
                    </filter>
                  </defs>
                  <g filter={`url(#${id}-f)`}>
                    <rect width="180" height="320" fill={`url(#${id}-g)`} />
                    {s.backdrop}
                    <Figure shirt={s.shirt} />
                  </g>
                </svg>
              </div>
              <p
                ref={(n) => {
                  caps.current[i] = n;
                }}
                className="mt-4 max-w-[12rem] text-[13px] font-medium leading-tight opacity-0"
              >
                {s.caption}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
