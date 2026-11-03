import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-5xl" aria-hidden="true">
        🎵
      </p>
      <h1 className="text-2xl font-bold">Cette page n’existe pas</h1>
      <p className="text-muted">
        Le lien est peut-être incomplet. Vérifie-le, ou écris-nous sur WhatsApp si tu cherches ta chanson.
      </p>
      <Link
        href="/"
        className="flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-md"
      >
        Retour à l’accueil
      </Link>
    </div>
  );
}
