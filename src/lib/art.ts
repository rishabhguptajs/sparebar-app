// Placeholder artwork: a soft gradient with a simple figure. Used by the landing page and dev-only previews.
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
