"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Masqué pendant la création et le paiement : le client y est déjà.
const HIDDEN = ["/creer", "/commande", "/admin"];

export function HeaderCta() {
  const pathname = usePathname();
  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;
  return (
    <Link
      href="/creer"
      className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold whitespace-nowrap text-cream transition active:scale-95 max-[359px]:px-3 md:h-11 md:px-5"
    >
      <span className="max-[359px]:hidden">Commencer</span>
      <span className="min-[360px]:hidden">Créer</span>
      <span aria-hidden="true" className="max-[379px]:hidden">→</span>
    </Link>
  );
}
