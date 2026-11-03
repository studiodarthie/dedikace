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
      className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-cream transition active:scale-95 md:h-11 md:px-5"
    >
      Commencer <span aria-hidden="true">→</span>
    </Link>
  );
}
