import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sparebar",
    short_name: "Sparebar",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c12",
    theme_color: "#0c0c12",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
