// Langues de l'interface. Français : adresses inchangées (/creer). Anglais : sous /en (/en/creer).
// Code partagé serveur + navigateur (pas de secret ici).

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: unknown): value is Locale {
  return value === "fr" || value === "en";
}

/** Langue d'une adresse : /en ou /en/… → anglais, tout le reste → français. */
export function localeFromPath(pathname: string | null | undefined): Locale {
  return pathname === "/en" || pathname?.startsWith("/en/") ? "en" : "fr";
}

/** Adresse dans la langue voulue : localePath("en", "/creer") → "/en/creer". */
export function localePath(locale: Locale, path: string): string {
  const clean = stripLocale(path);
  if (locale === "fr") return clean;
  return clean === "/" ? "/en" : clean.startsWith("/#") || clean.startsWith("/?") ? `/en${clean.slice(1)}` : `/en${clean}`;
}

/** Retire le préfixe de langue : "/en/creer" → "/creer", "/en" → "/". */
export function stripLocale(path: string): string {
  if (path === "/en") return "/";
  if (path.startsWith("/en/") || path.startsWith("/en?") || path.startsWith("/en#")) {
    const rest = path.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return path;
}

/** Choisit le texte de la langue : pick(locale, { fr: "Bonjour", en: "Hello" }). */
export function pick<T>(locale: Locale, values: Record<Locale, T>): T {
  return values[locale];
}

/** Liens hreflang pour les métadonnées d'une page qui existe dans les deux langues. */
export function alternates(locale: Locale, path: string) {
  const fr = stripLocale(path);
  return {
    canonical: localePath(locale, fr),
    languages: { fr: fr, en: localePath("en", fr), "x-default": fr },
  };
}

/** Format de date et de nombre par langue. */
export const intlLocale = (locale: Locale) => (locale === "en" ? "en-GB" : "fr-FR");
