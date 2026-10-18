import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next 15 does not keep a visited dynamic page in the browser, so every click refetched it.
    // Keep it for 30 seconds: going back and forth between pages is instant. Actions that change data
    // call router.refresh(), which clears this.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
