"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// A slow field of warped light with film grain. The pointer pushes a soft lens through it.
// It is abstract on purpose: it makes no claim about what the product outputs.

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform float uTime;
uniform float uSeed;
uniform vec2 uRes;
uniform vec2 uPointer;
uniform float uPush;
uniform float uLight;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + 7.3; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);

  vec2 m = (uPointer - 0.5) * vec2(asp, 1.0);
  vec2 dm = p - m;
  float lens = exp(-dot(dm, dm) * 5.0) * uPush;
  p += dm * lens * 0.35;

  float t = uTime * 0.045 + uSeed * 10.0;
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 4.0));
  vec2 r = vec2(fbm(p * 1.6 + 2.2 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p * 1.6 + 2.2 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.1 + 2.6 * r);

  vec3 c;
  if (uLight > 0.5) {
    vec3 base = vec3(0.965, 0.967, 0.975);
    vec3 lilac = vec3(0.78, 0.72, 1.0);
    vec3 peach = vec3(1.0, 0.80, 0.68);
    vec3 sky = vec3(0.66, 0.85, 1.0);
    vec3 rose = vec3(1.0, 0.68, 0.80);
    c = mix(base, sky, smoothstep(0.3, 0.8, f) * 0.8);
    c = mix(c, lilac, smoothstep(0.35, 0.85, r.x) * 0.75);
    c = mix(c, peach, smoothstep(0.5, 0.95, r.y) * smoothstep(0.3, 0.7, f) * 0.85);
    c = mix(c, rose, smoothstep(0.7, 1.0, q.x * f * 1.5) * 0.6);
    c = mix(c, base, 0.35);
    c += lens * 0.05;
    c += (hash(uv * uRes + uTime) - 0.5) * 0.025;
  } else {
    vec3 ink = vec3(0.027, 0.027, 0.04);
    vec3 indigo = vec3(0.10, 0.07, 0.30);
    vec3 magenta = vec3(0.95, 0.20, 0.50);
    vec3 ember = vec3(1.0, 0.55, 0.30);
    c = mix(ink, indigo, smoothstep(0.25, 0.75, f));
    c = mix(c, magenta, smoothstep(0.55, 0.95, r.x) * smoothstep(0.35, 0.8, f) * 0.85);
    c += ember * smoothstep(0.78, 1.0, q.y * f * 1.6) * 0.55;
    c += vec3(0.5, 0.55, 0.9) * lens * 0.10;
    float calm = smoothstep(1.15, 0.1, length(uv * vec2(1.0, 1.3)));
    c *= mix(1.0, 0.28, calm);
    c *= smoothstep(1.4, 0.35, length(uv - 0.5));
    c += (hash(uv * uRes + uTime) - 0.5) * 0.045;
  }
  gl_FragColor = vec4(c, 1.0);
}`;

export function HeroField({ seed = 0, light = false, className = "" }: { seed?: number; light?: boolean; className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5) * 0.6);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const uniforms = {
      uTime: { value: 0 },
      uSeed: { value: seed },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPush: { value: 0 },
      uLight: { value: light ? 1 : 0 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
    const geo = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geo, mat));

    function resize() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
    }
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (still) renderer.render(scene, camera);
    });
    ro.observe(el);

    const target = new THREE.Vector2(0.5, 0.5);
    let push = 0;
    let lastMove = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      lastMove = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let onscreen = true;
    const io = new IntersectionObserver(([e]) => {
      onscreen = e.isIntersecting;
    });
    io.observe(el);

    let raf = 0;
    function loop(t: number) {
      raf = requestAnimationFrame(loop);
      if (!onscreen) return;
      uniforms.uTime.value = t / 1000;
      uniforms.uPointer.value.lerp(target, 0.07);
      push += ((t - lastMove < 2500 ? 1 : 0) - push) * 0.04;
      uniforms.uPush.value = push;
      renderer.render(scene, camera);
    }
    if (still) renderer.render(scene, camera);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [seed, light]);

  return <div ref={host} aria-hidden="true" className={className} />;
}
