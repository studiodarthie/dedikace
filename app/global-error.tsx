"use client";

import "./globals.css";

// Dernier filet si la mise en page générale elle-même plante.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <title>Dédikace</title>
        <h1 className="text-2xl font-bold">Oups, le site a un souci</h1>
        <p className="text-muted">Réessaie dans un instant.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="h-14 rounded-2xl bg-brand px-6 text-lg font-bold text-white"
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
