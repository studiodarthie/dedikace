import type { ReactNode } from "react";
import { whatsappLink } from "@/lib/format";

export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";

/** Identité de l'éditeur, reprise dans les mentions légales. */
export const COMPANY = {
  name: "Darthie Studios",
  address: "413 rue Drouot, Douala, Cameroun",
  niu: "P097516175228W",
};

/** Mise en page commune des pages légales (validées par le porteur du projet le 7 novembre 2026). */
export function LegalPage({
  title,
  updated,
  locale = "fr",
  children,
}: {
  title: string;
  updated: string;
  locale?: "fr" | "en";
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-4 pt-4 leading-relaxed [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p_a]:font-semibold [&_p_a]:text-brand [&_p_a]:underline">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-sm text-muted">
        {locale === "en" ? `Last updated: ${updated}. This is a translation; the French version prevails.` : `Dernière mise à jour : ${updated}`}
      </p>
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
