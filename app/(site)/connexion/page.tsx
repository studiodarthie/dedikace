import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser, googleEnabled, safeNext } from "@/lib/auth";
import { loginWithGoogle } from "./actions";
import { EmailForm } from "./EmailForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  Verification: "Ce lien a expiré ou a déjà servi. Demande-en un nouveau.",
  OAuthAccountNotLinked: "Cette adresse est déjà utilisée. Connecte-toi avec le lien par e-mail.",
  AccessDenied: "Connexion refusée. Réessaie.",
};

export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Ton espace Dédikace</h1>
        <p className="text-lg text-muted">Retrouve toutes tes chansons, finis une commande, crée-en une autre.</p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNext(params.suite ?? params.callbackUrl);
  if (await getCurrentUser()) redirect(next);

  if (params.envoye) {
    return (
      <p role="status" className="rounded-2xl bg-leaf/10 p-4 font-medium text-leaf">
        C’est envoyé ! Ouvre ta boîte mail et touche le lien pour te connecter. Pense à regarder dans les spams.
      </p>
    );
  }
  const code = typeof params.error === "string" ? params.error : undefined;
  const error = code ? (ERRORS[code] ?? "La connexion n’a pas marché. Réessaie.") : undefined;

  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sand">
      {googleEnabled && (
        <>
          <form action={loginWithGoogle}>
            <input type="hidden" name="suite" value={next} />
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 text-lg font-bold ring-2 ring-sand transition active:scale-[0.98]"
            >
              <GoogleIcon />
              Continuer avec Google
            </button>
          </form>
          <p className="flex items-center gap-3 text-sm text-muted before:h-px before:flex-1 before:bg-sand after:h-px after:flex-1 after:bg-sand">
            ou
          </p>
        </>
      )}
      <EmailForm next={next} initialError={error} />
      <p className="text-sm text-muted">
        Pas besoin de mot de passe. Tu peux aussi créer une chanson sans compte.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
