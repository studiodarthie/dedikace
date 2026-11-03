import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage({ searchParams }: PageProps<"/admin/connexion">) {
  return (
    <div className="flex flex-col gap-4 pt-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Back-office</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/admin/connexion">["searchParams"] }) {
  const params = await searchParams;
  if (params.envoye) {
    return (
      <p role="status" className="rounded-2xl bg-leaf/10 p-4 font-medium text-leaf">
        C’est envoyé ! Ouvre ta boîte mail et clique sur le lien pour te connecter. Pense à regarder dans les spams.
      </p>
    );
  }
  const error =
    params.error === "AccessDenied"
      ? "Cette adresse n’a pas accès au back-office."
      : params.error === "Verification"
        ? "Ce lien a expiré ou a déjà servi. Demande-en un nouveau."
        : params.error
          ? "La connexion n’a pas marché. Réessaie."
          : undefined;
  return <LoginForm initialError={error} />;
}
