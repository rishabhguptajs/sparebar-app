// Sample content for the dev-only /preview routes. Never used by the real app.
import type { CharacterCard, ModelOption, PresentedJob } from "@/lib/ui-types";

export function art(seed: number, ratio = "3:4", figure = true) {
  const [w, h] = ratio.split(":").map(Number);
  const W = 400;
  const H = Math.round((W * h) / w);
  const h1 = (seed * 47) % 360;
  const h2 = (h1 + 45) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}'>
<defs>
<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h1} 72% 64%)'/><stop offset='1' stop-color='hsl(${h2} 62% 34%)'/></linearGradient>
<radialGradient id='r' cx='.3' cy='.18' r='.75'><stop offset='0' stop-color='white' stop-opacity='.6'/><stop offset='1' stop-color='white' stop-opacity='0'/></radialGradient>
</defs>
<rect width='${W}' height='${H}' fill='url(#g)'/><rect width='${W}' height='${H}' fill='url(#r)'/>
${
  figure
    ? `<ellipse cx='${W / 2}' cy='${H * 0.92}' rx='${W * 0.36}' ry='${H * 0.3}' fill='rgba(10,12,18,.38)'/><circle cx='${W / 2}' cy='${H * 0.4}' r='${W * 0.14}' fill='rgba(10,12,18,.38)'/>`
    : ""
}
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const sampleModels: ModelOption[] = [
  { key: "nano-banana-2.1", label: "Nano Banana 2.1", kind: "image", credits: 2, detail: "1K image", available: 38, paused: false },
  { key: "gemini-omni-flash", label: "Gemini Omni Flash", kind: "video", credits: 27, detail: "Around 8 seconds, 720p", available: 36, paused: false },
];

export const sampleCharacters: CharacterCard[] = [
  { id: "c1", name: "Maya", description: "Late twenties, shoulder length dark curls, warm brown skin, small gold hoops", coverUrl: art(3) },
  { id: "c2", name: "Theo", description: "Early thirties, short sandy hair, light stubble, denim jacket", coverUrl: art(8) },
  { id: "c3", name: "Ines", description: "Mid twenties, sleek black bob, round glasses, minimal makeup", coverUrl: art(13) },
];

const mk = (
  i: number,
  kind: "image" | "video",
  ratio: string,
  prompt: string,
  status: PresentedJob["status"] = "succeeded",
  mins = i * 37,
): PresentedJob => ({
  id: `s${i}`,
  modelKey: kind === "image" ? "nano-banana-2.1" : "gemini-omni-flash",
  modelLabel: kind === "image" ? "Nano Banana 2.1" : "Gemini Omni Flash",
  kind,
  prompt,
  aspectRatio: ratio,
  characterId: "c1",
  status,
  credits: kind === "image" ? 2 : 27,
  error: status === "failed" ? "Generation failed. Your credits were refunded." : null,
  createdAt: new Date(Date.now() - mins * 60_000).toISOString(),
  completedAt: null,
  outputs:
    status === "succeeded"
      ? [{ mime: "image/svg+xml", url: art(i * 5 + 1, ratio), downloadUrl: "#" }]
      : [],
});

export const sampleJobs: PresentedJob[] = [
  mk(1, "image", "9:16", "Unboxing a skincare set on a bright bathroom counter, handheld, natural light"),
  mk(2, "video", "9:16", "Walking through a farmers market with a tote bag, laughing at something off camera"),
  mk(3, "image", "1:1", "Flat lay of a morning routine, coffee, notebook and sunglasses"),
  mk(4, "image", "4:5", "Mirror selfie in a small apartment hallway, soft evening light"),
  mk(5, "video", "16:9", "Time lapse of a desk setup coming together, warm lamp, wide shot"),
  mk(6, "image", "9:16", "Portrait by a window, linen shirt, quiet morning", "failed"),
  mk(7, "image", "9:16", "Holding a ceramic mug up to the camera, cozy kitchen"),
  mk(8, "video", "9:16", "Applying lip balm in a car mirror, golden hour"),
];

export const sampleResult: PresentedJob = {
  ...mk(99, "video", "9:16", ""),
  outputs: [{ mime: "image/svg+xml", url: art(21, "9:16"), downloadUrl: "#" }],
};
