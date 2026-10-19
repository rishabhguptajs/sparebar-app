import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp ships its native part as separate packages that the build's file tracing does not pick up on its own,
  // so the function could not start it on Vercel. List them so they are packed with every server function.
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.pnpm/@img+sharp-linux-x64@*/**/*", "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/**/*", "./node_modules/.pnpm/@img+sharp-linuxmusl-x64@*/**/*", "./node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64@*/**/*"],
  },
  experimental: {
    // Next 15 does not keep a visited dynamic page in the browser, so every click refetched it.
    // Keep it for 30 seconds: going back and forth between pages is instant. Actions that change data
    // call router.refresh(), which clears this.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
