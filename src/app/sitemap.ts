import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/terms", "/privacy", "/refunds"].map((path) => ({ url: `${brand.url}${path}` }));
}
