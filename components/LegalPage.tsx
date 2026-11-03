import type { ReactNode } from "react";
import { whatsappLink } from "@/lib/format";

export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

/** Mise en page commune des pages légales. Textes provisoires : à faire relire par un juriste. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="flex flex-col gap-4 pt-4 leading-relaxed [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">
      <p role="note" className="rounded-2xl bg-gold/20 p-3 text-sm font-medium">
        Texte provisoire, en cours de relecture.
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-sm text-muted">Dernière mise à jour : {updated}</p>
      {children}
    </article>
  );
}

export function SupportLink({ children }: { children: ReactNode }) {
  if (!/^\+\d{8,15}$/.test(SUPPORT_PHONE)) return <>{children}</>;
  return (
    <a href={whatsappLink(SUPPORT_PHONE)} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">
      {children}
    </a>
  );
}
