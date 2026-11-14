import type { MetadataRoute } from "next";
import { localePath } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import { OCCASION_PAGES, STYLE_PAGES } from "@/lib/seo-pages";

// Plan du site pour Google : seulement les pages publiques utiles (pas les chansons des clients),
// en français et en anglais, chaque page annonçant sa version dans l'autre langue (hreflang).
export default function sitemap(): MetadataRoute.Sitemap {
  const both = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => {
    const languages = { fr: `${SITE_URL}${path}`, en: `${SITE_URL}${localePath("en", path)}` };
    return (["fr", "en"] as const).map((l) => ({
      url: languages[l],
      changeFrequency,
      // L'anglais vient un peu après le français (marché principal : le Cameroun francophone).
      priority: l === "fr" ? priority : Math.round(priority * 0.8 * 10) / 10,
      alternates: { languages },
    }));
  };
  return [
    ...both("/", 1, "weekly"),
    ...both("/creer", 0.9, "weekly"),
    ...OCCASION_PAGES.flatMap((p) => both(`/chanson/${p.slug}`, 0.8)),
    ...STYLE_PAGES.flatMap((p) => both(`/style/${p.id}`, 0.6)),
    ...both("/cgu", 0.1, "yearly"),
    ...both("/confidentialite", 0.1, "yearly"),
    ...both("/remboursement", 0.1, "yearly"),
  ];
}
