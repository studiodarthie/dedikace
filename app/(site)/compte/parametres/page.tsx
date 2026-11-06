import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { deleteMyAccount, logoutAction } from "../actions";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Paramètres", robots: { index: false, follow: false } };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex items-center gap-3">
        <Link href="/compte" aria-label="Retour à mon espace" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl ring-1 ring-sand">
          ←
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Paramètres</h1>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const user = await requireUser("/compte/parametres");
  const profile = await getProfile(user.id);
  return (
    <>
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sand">
        <p className="text-sm text-muted">
          Connecté avec <strong className="text-ink">{profile?.email ?? user.email}</strong>
        </p>
        <ProfileForm name={profile?.name ?? ""} phone={profile?.phone ?? ""} />
      </section>

      <nav aria-label="Informations" className="flex flex-col divide-y divide-sand overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-sand">
        {[
          ["/confidentialite", "🛡️", "Confidentialité"],
          ["/cgu", "📄", "Conditions d'utilisation"],
          ["/remboursement", "↩️", "Remboursement"],
        ].map(([href, icon, label]) => (
          <Link key={href} href={href} className="flex h-14 items-center gap-3 px-5 font-semibold">
            <span aria-hidden="true">{icon}</span>
            <span className="flex-1">{label}</span>
            <span className="text-muted" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </nav>

      <form action={logoutAction}>
        <button type="submit" className="flex h-14 w-full items-center justify-center rounded-2xl bg-white font-bold text-brand ring-1 ring-sand">
          Se déconnecter
        </button>
      </form>

      <details className="rounded-3xl bg-white p-5 ring-1 ring-sand">
        <summary className="cursor-pointer font-bold text-brand-dark">Supprimer mon compte</summary>
        <form action={deleteMyAccount} className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-muted">
            Ton compte, ton prénom et ton numéro enregistrés sont effacés. Tes chansons restent accessibles par leur lien
            WhatsApp, mais n’apparaîtront plus dans un espace. C’est définitif.
          </p>
          <label className="flex items-center gap-3 font-medium">
            <input type="checkbox" name="confirm" value="oui" required className="h-5 w-5" />
            Oui, je veux supprimer mon compte
          </label>
          <button type="submit" className="flex h-12 items-center justify-center rounded-2xl bg-brand-dark px-6 font-bold text-white">
            Supprimer définitivement
          </button>
        </form>
      </details>
    </>
  );
}
