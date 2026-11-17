import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/app-store-screenshot-sizes", "/google-play-feature-graphic", "/localize-app-store-screenshots", "/privacy", "/terms"].map((p) => ({
    url: `${SITE.url}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }));
}
