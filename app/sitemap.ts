import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { OCCASION_PAGES, STYLE_PAGES } from "@/lib/seo-pages";

// Plan du site pour Google : seulement les pages publiques utiles (pas les chansons des clients).
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/creer", 0.9, "weekly"),
    ...OCCASION_PAGES.map((p) => page(`/chanson/${p.slug}`, 0.8)),
    ...STYLE_PAGES.map((p) => page(`/style/${p.id}`, 0.6)),
    page("/cgu", 0.1, "yearly"),
    page("/confidentialite", 0.1, "yearly"),
    page("/remboursement", 0.1, "yearly"),
  ];
}
