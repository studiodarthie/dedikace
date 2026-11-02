"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    if (!window.confirm("On recrée 2 nouvelles versions de ta chanson, avec les mêmes paroles. C'est gratuit, une seule fois. Continuer ?")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Une erreur est survenue. Réessaie.");
        return;
      }
      router.refresh();
    } catch {
      setError("Pas de connexion internet. Réessaie.");
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
        {busy ? "Un instant…" : "La chanson ne me plaît pas"}
      </button>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
