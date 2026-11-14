"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/use-locale";

/** Recharge la page toutes les 10 s tant que la chanson est en cours de création. */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}

export function RegenerateButton({ code }: { code: string }) {
  const router = useRouter();
  const en = useLocale() === "en";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    const question = en
      ? "We’ll make 2 new versions of your song, with the same lyrics. It’s free, once only. Continue?"
      : "On recrée 2 nouvelles versions de ta chanson, avec les mêmes paroles. C'est gratuit, une seule fois. Continuer ?";
    if (!window.confirm(question)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, locale: en ? "en" : "fr" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? (en ? "Something went wrong. Try again." : "Une erreur est survenue. Réessaie."));
        return;
      }
      router.refresh();
    } catch {
      setError(en ? "No internet connection. Try again." : "Pas de connexion internet. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={regenerate}
        disabled={busy}
        className="h-12 rounded-2xl bg-white font-semibold ring-1 ring-sand disabled:opacity-50"
      >
        {busy ? (en ? "One moment…" : "Un instant…") : en ? "I don’t like the song" : "La chanson ne me plaît pas"}
      </button>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

// Au plus une nouvelle tentative toutes les 30 s, pour ne pas boucler si le réseau est coupé.
const RETRY_AFTER_MS = 30_000;
let lastRetry = 0;

/**
 * Lecteur audio qui se répare tout seul : si le fichier ne se charge pas (lien expiré après 1 h,
 * chargement coupé en 3G), la page redemande au serveur des liens neufs.
 */
export function SongPlayer({ src }: { src: string }) {
  const en = useLocale() === "en";
  const router = useRouter();
  const ref = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);

  function onError() {
    setFailed(true);
    if (Date.now() - lastRetry < RETRY_AFTER_MS) return;
    lastRetry = Date.now();
    router.refresh();
  }

  // L'erreur a pu survenir avant que React soit prêt (le navigateur charge le fichier tout de suite).
  useEffect(() => {
    if (ref.current?.error) onError();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- vérification unique par lien
  }, [src]);

  return (
    <>
      <audio ref={ref} key={src} controls preload="metadata" src={src} onError={onError} onLoadedMetadata={() => setFailed(false)} className="w-full">
        {en ? "Your browser can’t play this file." : "Ton navigateur ne peut pas lire ce fichier."}
      </audio>
      {failed && (
        <p role="status" className="mt-2 text-sm text-muted">
          {en ? "Slow loading…" : "Chargement difficile…"}{" "}
          <button type="button" onClick={() => window.location.reload()} className="font-semibold text-brand underline">
            {en ? "Reload" : "Recharger"}
          </button>
        </p>
      )}
    </>
  );
}
