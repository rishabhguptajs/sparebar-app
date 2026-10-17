"use client";

import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";

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
      <g>
        <g stroke="#7aa3a9" strokeWidth="1.2" fill="none" opacity=".8">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${i * 24} 0V320M0 ${i * 24}H180`} />
          ))}
        </g>
        <circle cx="130" cy="70" r="30" fill="#fff" />
        <circle cx="140" cy="62" r="30" fill="#dfeaec" />
        {[28, 52, 160].map((x, i) => (
          <circle key={x} style={{ animationDelay: `${i * -1.3}s` }} cx={x} cy="250" r="4" fill="#fff" stroke={INK} strokeWidth="1.5" />
        ))}
      </g>
    ),
  },
  {
    caption: "Golden hour, the road goes up",
    sky: ["#ffe48a", "#ff8a3d"],
    shirt: "#0e6e6b",
    backdrop: (
      <g>
        <circle cx="132" cy="120" r="40" fill="#fff3c4" />
        <circle cx="36" cy="60" r="12" fill="#fff3c4" />
        <path d="M70 320L88 0H112L130 320Z" fill="#c4542a" />
        <path d="M100 320V0" stroke="#ffe48a" strokeWidth="3" strokeDasharray="14 14" />
      </g>
    ),
  },
  {
    caption: "Mirror selfie, someone else in it",
    sky: ["#c9bcff", "#6a56d6"],
    shirt: "#f4d35e",
    backdrop: (
      <g>
        <rect x="14" y="30" width="84" height="196" rx="42" fill="#e6e0ff" />
        <g transform="translate(34 100) scale(.28)">
          <path d="M14 320C14 246 52 220 90 220C128 220 166 246 166 320Z" fill={INK} />
          <ellipse cx="90" cy="158" rx="30" ry="38" fill={SKIN} />
          <path d="M57 152C52 108 76 96 94 96C120 96 134 118 124 154C114 132 98 126 80 128C69 132 63 141 57 152Z" fill={INK} />
        </g>
        <rect x="14" y="30" width="84" height="196" rx="42" fill="none" stroke={INK} strokeWidth="3" />
        <rect x="124" y="40" width="34" height="62" rx="3" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <circle cx="150" cy="74" r="2.5" fill={INK} />
      </g>
    ),
  },
  {
    caption: "Coffee run, the cup is bigger",
    sky: ["#f3e3d0", "#d1a77c"],
    shirt: "#1b2a6b",
    backdrop: (
      <g>
        <g fill="#fff8ee" stroke={INK} strokeWidth="2.5">
          <rect x="14" y="26" width="152" height="110" />
          <path d="M90 26V136M14 81H166" fill="none" />
        </g>
        <g >
          <path d="M104 176H168L160 270H112Z" fill="#fff" stroke={INK} strokeWidth="3" />
          <path d="M168 190C190 190 190 236 164 238" fill="none" stroke={INK} strokeWidth="3" />
        </g>
        {[122, 140].map((x, i) => (
          <path key={x} style={{ animationDelay: `${i * -1.6}s` }} d={`M${x} 170C${x - 10} 150 ${x + 10} 140 ${x} 120`} fill="none" stroke={INK} strokeWidth="2" />
        ))}
      </g>
    ),
  },
  {
    caption: "Unboxing, it keeps coming",
    sky: ["#fbd1de", "#e5688f"],
    shirt: "#9fe3c5",
    backdrop: (
      <g>
        <path d="M118 250L100 0H162L146 250Z" fill="#fff" opacity=".35" />
        <rect x="104" y="226" width="58" height="46" fill="#ff2f7e" stroke={INK} strokeWidth="2.5" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
                        style={{ animationDelay: `${i * -1.1}s`, animationDuration: "4.4s" }}
            x={112 + (i % 2) * 22}
            y="200"
            width="16"
            height="16"
            fill={["#fff", "#f4d35e", "#9fe3c5", "#c9bcff"][i]}
            stroke={INK}
            strokeWidth="2"
          />
        ))}
      </g>
    ),
  },
  {
    caption: "Night market, the stairs stop",
    sky: ["#1b2a6b", "#0b1019"],
    shirt: "#ff6b3d",
    backdrop: (
      <g>
        {[18, 52, 96, 134, 160].map((x, i) => (
          <g key={x} style={{ animationDelay: `${i * -0.7}s` }}>
            <ellipse cx={x} cy={46 + (i % 2) * 24} rx="11" ry="9" fill="#ffd36e" />
            <circle cx={x} cy={46 + (i % 2) * 24} r="3.5" fill={INK} />
          </g>
        ))}
        <path d="M0 250H44V228H72V206H100V184H128V162H156V140" fill="none" stroke="#ffd36e" strokeWidth="3" />
      </g>
    ),
  },
  {
    caption: "Gym floor, nobody else is here",
    sky: ["#bfe9d6", "#3f9c86"],
    shirt: "#0b1519",
    backdrop: (
      <g>
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i} transform={`translate(${14 + i * 28} 262) scale(.14)`}>
            <path d="M14 320C14 246 52 220 90 220C128 220 166 246 166 320Z" fill={INK} />
            <ellipse cx="90" cy="158" rx="30" ry="38" fill={SKIN} />
            <path d="M57 152C52 108 76 96 94 96C120 96 134 118 124 154C114 132 98 126 80 128C69 132 63 141 57 152Z" fill={INK} />
          </g>
        ))}
        <g fill={INK}>
          <rect x="22" y="48" width="136" height="7" />
          <rect x="14" y="30" width="12" height="43" />
          <rect x="154" y="30" width="12" height="43" />
        </g>
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
      {[78, 102].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="158" rx="6.5" ry="5" fill="#fff" />
          <circle cx={x + 1.5} cy="158.5" r="2.6" fill={INK} />
        </g>
      ))}
    </g>
  );
}

function sceneSvg(s: Scene, i: number) {
  return renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 320" width="540" height="960">
      <defs>
        <linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.sky[0]} />
          <stop offset="1" stopColor={s.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="180" height="320" fill={`url(#g${i})`} />
      {s.backdrop}
      <Figure shirt={s.shirt} />
    </svg>,
  );
}

const svgUrl = (markup: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

const VERT = `
uniform float uBend;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  w.z -= uBend * w.x * w.x;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const ROUND = `
float roundBox(vec2 uv, float r) {
  vec2 p = abs(uv - 0.5) - (0.5 - r);
  return length(max(p, 0.0)) - r;
}`;

const FRAG = `
uniform sampler2D uTex;
uniform float uTime;
uniform float uMelt;
uniform float uFocus;
uniform float uSeed;
uniform vec2 uPointer;
varying vec2 vUv;
${ROUND}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  if (roundBox(vUv, 0.035) > 0.0) discard;
  vec2 uv = vUv;
  vec2 off = vec2(
    noise(uv * vec2(2.5, 6.0) + uSeed + uTime * 0.25),
    noise(uv * vec2(4.0, 2.5) + uSeed * 2.0 - uTime * 0.2)) - 0.5;
  uv += off * 0.26 * uMelt;
  uv.y -= uMelt * 0.07 * (0.5 + 0.5 * sin(uv.x * 11.0 + uTime * 1.6 + uSeed)) * (1.0 - vUv.y);
  vec2 dir = vUv - uPointer;
  float d = length(dir);
  uv += normalize(dir + 1e-4) * sin(d * 34.0 - uTime * 4.0) * 0.012 * smoothstep(0.55, 0.0, d) * uFocus;
  float sh = 0.004 + 0.02 * uMelt;
  vec3 c = vec3(texture2D(uTex, uv + vec2(sh, 0.0)).r, texture2D(uTex, uv).g, texture2D(uTex, uv - vec2(sh, 0.0)).b);
  c += (hash(vUv * 700.0 + uTime) - 0.5) * 0.05;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

const SHADOW_FRAG = `
uniform vec3 uColor;
varying vec2 vUv;
${ROUND}
void main() {
  if (roundBox(vUv, 0.035) > 0.0) discard;
  gl_FragColor = vec4(uColor, 1.0);
  #include <colorspace_fragment>
}`;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const ROW = [0, -0.35, -0.08, -0.5, -0.15, -0.42, -0.04];
const W = 1.125;
const GAP = 0.4;

export function HeroStrip() {
  const box = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLParagraphElement>(null);
  const [fallback, setFallback] = useState<string[] | null>(null);

  useEffect(() => {
    const host = box.current!;
    const markups = SCENES.map(sceneSvg);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFallback(markups.map(svgUrl));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    const group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.PlaneGeometry(W, 2, 1, 1);
    const ink = new THREE.Color(INK);
    const meshes: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; x: number; y: number }[] = [];
    const total = SCENES.length * W + (SCENES.length - 1) * GAP;

    SCENES.forEach((_, i) => {
      const x = -total / 2 + W / 2 + i * (W + GAP);
      const y = ROW[i] + 0.2;
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTex: { value: null },
          uTime: { value: 0 },
          uMelt: { value: 1 },
          uFocus: { value: 0 },
          uSeed: { value: i * 7.3 + 1 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uBend: { value: 0.012 },
        },
      });
      const shadow = new THREE.Mesh(
        geo,
        new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: SHADOW_FRAG,
          uniforms: { uColor: { value: ink }, uBend: { value: 0.012 } },
        }),
      );
      const mesh = new THREE.Mesh(geo, mat);
      shadow.position.set(0.07, -0.07, -0.01);
      mesh.add(shadow);
      mesh.position.set(x, y, 0);
      group.add(mesh);
      meshes.push({ mesh, mat, x, y });
    });

    let loaded = 0;
    const textures: THREE.Texture[] = [];
    markups.forEach((m, i) => {
      const img = new Image();
      img.onload = () => {
        const t = new THREE.Texture(img);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        t.needsUpdate = true;
        meshes[i].mat.uniforms.uTex.value = t;
        textures.push(t);
        if (++loaded === markups.length && still) draw(0);
      };
      img.src = svgUrl(m);
    });

    let visibleW = 10;
    function resize() {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const visibleH = 3.3;
      camera.position.set(0, 0, visibleH / 2 / Math.tan((camera.fov * Math.PI) / 360));
      camera.updateProjectionMatrix();
      visibleW = visibleH * camera.aspect;
    }
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw(0);
    });
    ro.observe(host);

    const pointer = { x: 0, y: 0, active: false, last: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.last = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const focus = SCENES.map(() => 0);
    const ndc = new THREE.Vector3();
    let slide = 0;
    let lastCap = -1;
    let onscreen = true;
    let raf = 0;

    function draw(t: number) {
      const rect = host.getBoundingClientRect();
      if (pointer.active && t - pointer.last > 3500) pointer.active = false;
      const sweep = 0.5 + 0.5 * Math.sin(t / 3200);
      const along = pointer.active ? clamp((pointer.x - rect.left) / rect.width, 0, 1) : sweep;
      // Pointer in NDC of this canvas, or a synthetic point sweeping the strip.
      const pxN = pointer.active ? ((pointer.x - rect.left) / rect.width) * 2 - 1 : sweep * 2 - 1;
      const pyN = pointer.active ? -(((pointer.y - rect.top) / rect.height) * 2 - 1) : 0;

      const overflow = Math.max(0, total - visibleW + 0.8);
      slide += (overflow / 2 - along * overflow - slide) * 0.06;
      group.position.x = slide;
      group.updateMatrixWorld(true);

      let best = 0;
      meshes.forEach(({ mesh, mat, y }, i) => {
        ndc.set(mesh.position.x, y, 0).applyMatrix4(group.matrixWorld).project(camera);
        const dist = Math.hypot((pxN - ndc.x) * camera.aspect, (pyN - ndc.y) * 0.8);
        const target = still ? 0.25 : clamp(1 - dist / 0.62, 0, 1);
        focus[i] += (target - focus[i]) * 0.1;
        const k = focus[i];
        if (k > focus[best]) best = i;
        mat.uniforms.uTime.value = t / 1000;
        mat.uniforms.uMelt.value = (1 - k) ** 1.4;
        mat.uniforms.uFocus.value = k;
        mat.uniforms.uPointer.value.set(clamp(0.5 + (pxN - ndc.x) * 1.4, 0, 1), clamp(0.5 + (pyN - ndc.y) * 0.6, 0, 1));
        mesh.rotation.y = clamp(ndc.x - pxN, -1, 1) * 0.28 * k;
        const sc = 1 + 0.08 * k;
        mesh.scale.set(sc, sc, 1);
        mesh.position.y = y + 0.05 * Math.sin(t / 1400 + i * 1.3);
      });
      if (best !== lastCap && cap.current) {
        lastCap = best;
        cap.current.textContent = SCENES[best].caption;
      }
      renderer.render(scene, camera);
    }

    function loop(t: number) {
      if (onscreen) draw(t);
      raf = requestAnimationFrame(loop);
    }
    if (!still) raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => {
      onscreen = e.isIntersecting;
    });
    io.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      textures.forEach((t) => t.dispose());
      geo.dispose();
      meshes.forEach(({ mat, mesh }) => {
        mat.dispose();
        ((mesh.children[0] as THREE.Mesh).material as THREE.Material).dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div ref={box} className="h-[clamp(22rem,50vw,34rem)] w-full">
        {fallback && (
          <div className="flex h-full items-center gap-4 overflow-hidden px-5">
            {fallback.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src.length + src.slice(-20)} src={src} alt="" className="h-4/5 shrink-0 rounded-[10px]" />
            ))}
          </div>
        )}
      </div>
      <p ref={cap} className="mx-auto mt-1 mb-6 h-5 max-w-7xl px-5 text-[13px] font-medium lg:px-10" />
    </div>
  );
}
