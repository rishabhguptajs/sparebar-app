import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/terms", "/privacy", "/refunds"], disallow: ["/app", "/api", "/invoice", "/preview", "/auth"] },
    sitemap: `${brand.url}/sitemap.xml`,
  };
}
