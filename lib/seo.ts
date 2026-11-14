import { env } from "@/lib/env";
import type { Faq } from "@/lib/seo-pages";

// Données structurées schema.org communes (accueil et pages de présentation).

export const SITE_URL = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
export const SITE_NAME = "Dédikace";

export const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organisation`,
  name: SITE_NAME,
  legalName: "Darthie Studios",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/icone-512.png`,
  address: { "@type": "PostalAddress", addressLocality: "Douala", addressCountry: "CM" },
};

/** Le service vendu, avec son prix en FCFA (aucune note ni avis inventés). */
export function serviceSchema(name: string, description: string, url: string) {
  return {
    "@type": "Service",
    name,
    description,
    url,
    serviceType: "Chanson personnalisée",
    provider: { "@id": `${SITE_URL}/#organisation` },
    areaServed: [{ "@type": "Country", name: "Cameroun" }, "Afrique centrale", "Diaspora africaine"],
    offers: {
      "@type": "Offer",
      price: env.PRICE_MOMO_XAF,
      priceCurrency: "XAF",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/creer`,
    },
  };
}

export function faqSchema(items: Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
