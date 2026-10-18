import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

const PRIVATE = [
  "/app",
  "/api",
  "/invoice",
  "/preview",
  "/auth",
  "/login",
  "/paused",
];

// Search and AI answer engines are welcome on every public page. Only the signed in app and its APIs are closed.
const WELCOMED = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "DuckDuckBot",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "YouBot",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...WELCOMED.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE,
      })),
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${brand.url}/sitemap.xml`,
    host: brand.url,
  };
}
