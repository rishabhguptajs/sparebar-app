import type { MetadataRoute } from "next";
import { catalog, abs } from "@/lib/seo";

const UPDATED = new Date("2026-10-19");

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (
    path: string,
    priority: number,
    changeFrequency: "weekly" | "monthly" | "yearly" = "monthly",
  ) => ({
    url: abs(path),
    lastModified: UPDATED,
    changeFrequency,
    priority,
  });
  return [
    page("", 1, "weekly"),
    page("/models", 0.9, "weekly"),
    page("/pricing", 0.9),
    page("/ai-ugc-generator", 0.9),
    page("/ai-influencer-generator", 0.8),
    page("/consistent-character-ai", 0.8),
    page("/ai-product-ads", 0.8),
    page("/features", 0.8),
    page("/about", 0.5),
    ...catalog().map((m) => page(`/models/${m.key}`, 0.7)),
    page("/terms", 0.2, "yearly"),
    page("/privacy", 0.2, "yearly"),
    page("/refunds", 0.2, "yearly"),
  ];
}
