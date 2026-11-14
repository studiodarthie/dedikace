"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, stripLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

// Masqué pendant la création et le paiement : le client y est déjà.
const HIDDEN = ["/creer", "/commande", "/admin"];

export function HeaderCta() {
  const pathname = stripLocale(usePathname() ?? "/");
  const locale = useLocale();
  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;
  const en = locale === "en";
  return (
    <Link
      href={localePath(locale, "/creer")}
      className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-3 text-sm font-bold whitespace-nowrap text-cream transition active:scale-95 min-[400px]:px-4 md:h-11 md:px-5"
    >
      <span className="max-[479px]:hidden">{en ? "Get started" : "Commencer"}</span>
      <span className="min-[480px]:hidden">{en ? "Create" : "Créer"}</span>
      <span aria-hidden="true" className="max-[479px]:hidden">→</span>
    </Link>
  );
}
