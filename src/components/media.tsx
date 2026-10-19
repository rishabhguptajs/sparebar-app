"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

type Output = { mime: string; url: string; thumbUrl?: string | null };

/** An image that holds its place with a soft shimmer and fades in once it has loaded. */
function FadeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(!!ref.current?.complete && !!ref.current.naturalWidth);
  }, [src]);

  return (
    <span className={`relative block size-full ${loaded ? "" : "img-shimmer"}`}>
      <img ref={ref} src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} className={`${className ?? ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`} />
    </span>
  );
}

/**
 * An image or a video. `small` is for grids: it shows the small copy when there is one, and a video only
 * loads its first frame.
 */
export function Media({ output, alt, className, controls = false, small = false }: { output: Output; alt: string; className?: string; controls?: boolean; small?: boolean }) {
  if (output.mime.startsWith("video/")) {
    return <video src={output.url} className={className} controls={controls} autoPlay={controls} loop muted={!controls} playsInline preload={small ? "metadata" : "auto"} />;
  }
  return <FadeImg src={small && output.thumbUrl ? output.thumbUrl : output.url} alt={alt} className={className} />;
}

export function Thumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <FadeImg src={src} alt={alt} className={className} />;
}
