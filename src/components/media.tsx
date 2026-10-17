/* eslint-disable @next/next/no-img-element */
type Output = { mime: string; url: string };

export function Media({
  output,
  alt,
  className,
  controls = false,
}: {
  output: Output;
  alt: string;
  className?: string;
  controls?: boolean;
}) {
  if (output.mime.startsWith("video/")) {
    return (
      <video
        src={output.url}
        className={className}
        controls={controls}
        autoPlay={controls}
        loop
        muted={!controls}
        playsInline
        preload="metadata"
      />
    );
  }
  return <img src={output.url} alt={alt} className={className} loading="lazy" decoding="async" />;
}

export function Thumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />;
}
