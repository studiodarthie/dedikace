"use client";

import Link from "next/link";
import { useLocale } from "@/lib/use-locale";
import { MissionCta } from "@/components/MissionCta";

export default function NotFound() {
  const en = useLocale() === "en";
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden="true">
        🎵
      </p>
      <h1 className="text-2xl font-bold">{en ? "This page doesn’t exist" : "Cette page n’existe pas"}</h1>
      <p className="text-muted">
        {en
          ? "The link may be incomplete. Check it, or message us on WhatsApp if you’re looking for your song."
          : "Le lien est peut-être incomplet. Vérifie-le, ou écris-nous sur WhatsApp si tu cherches ta chanson."}
      </p>
      <Link
        href={en ? "/en" : "/"}
        className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md"
      >
        {en ? "Back to home" : "Retour à l’accueil"}
      </Link>
      <MissionCta locale={en ? "en" : "fr"} className="mt-10 w-full" />
    </div>
  );
}
