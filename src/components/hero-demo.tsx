"use client";

import { useEffect, useState } from "react";

// A small replay of the studio: pick a character, type a scene, get shots back.
// Photos are read from /hero/<scene>-<shot>.webp. A missing photo shows a plain tinted frame.

const SCENES = [
  { prompt: "Tara's morning: skincare at the bathroom mirror, then coffee at the cafe", tint: ["#ffd9e4", "#f6a6c1"] },
  { prompt: "Tara in the monsoon, a grey saree on the balcony and a selfie in the rain", tint: ["#dfe4ff", "#a9b4f2"] },
  { prompt: "Tara's weekend: yoga at home, a night out in the city, an iced coffee", tint: ["#ffe7c2", "#f2b878"] },
];

const SHOTS = [0, 1, 2];

function Frame({ scene, shot, ready }: { scene: number; shot: number; ready: boolean }) {
  const src = `/hero/${scene + 1}-${shot + 1}.webp`;
  const [found, setFound] = useState<string | null>(null);
  // Probe first, so a missing photo never renders as a broken image.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setFound(src);
    img.src = src;
  }, [src]);
  const t = SCENES[scene].tint;
  return (
    <div
      className="relative aspect-[9/16] overflow-hidden rounded-2xl"
      style={{ background: `linear-gradient(160deg, ${t[0]}, ${t[1]})` }}
    >
      {found === src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {!ready && <div className="demo-shimmer absolute inset-0" />}
    </div>
  );
}

export function HeroDemo({ imageCredits }: { imageCredits: number }) {
  const [scene, setScene] = useState(0);
  const [typed, setTyped] = useState(SCENES[0].prompt.length);
  const [phase, setPhase] = useState<"typing" | "working" | "done">("done");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const wait = (ms: number) => new Promise<void>((r) => (timer = setTimeout(r, ms)));
    (async () => {
      await wait(2600);
      let i = 0;
      while (alive) {
        i = (i + 1) % SCENES.length;
        setScene(i);
        setPhase("typing");
        const text = SCENES[i].prompt;
        for (let n = 0; n <= text.length && alive; n++) {
          setTyped(n);
          await wait(26);
        }
        await wait(450);
        setPhase("working");
        await wait(1700);
        setPhase("done");
        await wait(4200);
      }
    })();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const text = SCENES[scene].prompt.slice(0, typed);

  return (
    <div className="w-full max-w-[34rem] rounded-[28px] border border-line bg-white/85 p-4 shadow-[0_40px_90px_-30px_rgb(60_40_120/0.35)] backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#ff7aa8] to-[#ffb36b] text-sm font-semibold text-white">T</span>
          <div className="leading-tight">
            <p className="text-sm font-medium">Tara</p>
            <p className="text-xs text-ink-2">Character, same face every shot</p>
          </div>
        </div>
        <span className="rounded-full bg-ink/[0.06] px-3 py-1 text-xs text-ink-2">Nano Banana 2.1</span>
      </div>

      <div className="mt-4 min-h-[5.5rem] rounded-2xl bg-ink/[0.045] px-4 py-3 text-[15px] leading-relaxed">
        {text}
        {phase === "typing" && <span className="demo-caret ml-px inline-block h-[1.1em] w-px translate-y-[3px] bg-ink" />}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex rounded-full bg-ink/[0.06] p-1 text-xs font-medium">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">Image</span>
          <span className="px-3 py-1 text-ink-2">Video</span>
        </div>
        <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
          {phase === "working" ? "Generating" : `Generate, ${imageCredits} credits`}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {SHOTS.map((_, i) => (
          <Frame key={i} scene={scene} shot={i} ready={phase === "done"} />
        ))}
      </div>
    </div>
  );
}
