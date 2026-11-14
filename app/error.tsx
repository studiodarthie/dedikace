"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/use-locale";

// Erreur inattendue dans une page : message en français et bouton pour réessayer (connexion 3G instable…).
export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  const en = useLocale() === "en";
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden="true">
        😕
      </p>
      <h1 className="text-2xl font-bold">{en ? "Oops, it didn’t load" : "Oups, ça n’a pas chargé"}</h1>
      <p className="text-muted">
        {en ? "Your connection may have dropped. Try again: nothing is lost." : "Ta connexion a peut-être coupé. Réessaie : rien n’est perdu."}
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md"
      >
        {en ? "Try again" : "Réessayer"}
      </button>
    </div>
  );
}
