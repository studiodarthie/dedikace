"use client";

import { usePathname } from "next/navigation";
import { localeFromPath, type Locale } from "@/lib/i18n";

/** Langue de la page en cours, d'après son adresse (/en/… → anglais). Composants navigateur uniquement. */
export function useLocale(): Locale {
  return localeFromPath(usePathname());
}
