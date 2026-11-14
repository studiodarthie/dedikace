import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Les pages des chansons (/s/…) et des commandes restent lisibles par les robots d'aperçu
// (WhatsApp, Facebook) : elles portent déjà « noindex », Google ne les référence pas.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/compte", "/connexion", "/en/compte", "/en/connexion"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
