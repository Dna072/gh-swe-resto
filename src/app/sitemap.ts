import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const paths = ["", "/menu", "/contact", "/legal/allergens", "/legal/terms", "/legal/privacy"];
  return paths.map((path, index) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/menu" || path === "" ? "daily" : "monthly",
    priority: index === 0 ? 1 : 0.7,
  }));
}
