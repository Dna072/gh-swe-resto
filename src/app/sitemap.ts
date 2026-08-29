import type { MetadataRoute } from "next";
import { loadPublicCatalog } from "@/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const catalog = await loadPublicCatalog();
  const staticPaths = ["", "/menu", "/contact", "/legal/allergens", "/legal/terms", "/legal/privacy"];
  const pages: MetadataRoute.Sitemap = staticPaths.map((path, index) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/menu" || path === "" ? "daily" : "monthly",
    priority: index === 0 ? 1 : 0.7,
  }));
  for (const item of catalog.items) {
    pages.push({
      url: `${base}/menu/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  return pages;
}
