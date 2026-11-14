import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { localePath, type Locale } from "@/lib/i18n";
import { deleteMyAccount, logoutAction } from "../actions";
import { ProfileForm } from "./ProfileForm";

// Paramètres du compte, partagés par /compte/parametres et /en/compte/parametres.

const T = {
  fr: {
    back: "Retour à mon espace",
    title: "Paramètres",
    signedAs: "Connecté avec ",
    links: [
      ["/confidentialite", "🛡️", "Confidentialité"],
      ["/cgu", "📄", "Conditions d'utilisation"],
      ["/remboursement", "↩️", "Remboursement"],
    ],
    info: "Informations",
    logout: "Se déconnecter",
    delete: "Supprimer mon compte",
    deleteText:
      "Ton compte, ton prénom et ton numéro enregistrés sont effacés. Tes chansons restent accessibles par leur lien WhatsApp, mais n’apparaîtront plus dans un espace. C’est définitif.",
    confirm: "Oui, je veux supprimer mon compte",
    deleteButton: "Supprimer définitivement",
  },
  en: {
    back: "Back to my space",
    title: "Settings",
    signedAs: "Signed in as ",
    links: [
      ["/confidentialite", "🛡️", "Privacy"],
      ["/cgu", "📄", "Terms of use"],
      ["/remboursement", "↩️", "Refunds"],
    ],
    info: "Information",
    logout: "Sign out",
    delete: "Delete my account",
    deleteText:
      "Your account, first name and saved number are erased. Your songs stay available through their WhatsApp link, but won’t appear in a space anymore. This is permanent.",
    confirm: "Yes, I want to delete my account",
    deleteButton: "Delete permanently",
  },
};

export function SettingsScreen({ locale }: { locale: Locale }) {
  const t = T[locale];
  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="flex items-center gap-3">
        <Link href={localePath(locale, "/compte")} aria-label={t.back} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl ring-1 ring-sand">
          ←
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-sand/60" aria-label="Chargement" />}>
        <SettingsContent locale={locale} />
      </Suspense>
    </div>
  );
}

async function SettingsContent({ locale }: { locale: Locale }) {
  const t = T[locale];
  const user = await requireUser(localePath(locale, "/compte/parametres"));
  const profile = await getProfile(user.id);
  return (
    <>
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-sand">
        <p className="text-sm text-muted">
          {t.signedAs}
          <strong className="text-ink">{profile?.email ?? user.email}</strong>
        </p>
        <ProfileForm name={profile?.name ?? ""} phone={profile?.phone ?? ""} />
      </section>

      <nav aria-label={t.info} className="flex flex-col divide-y divide-sand overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-sand">
        {t.links.map(([href, icon, label]) => (
          <Link key={href} href={localePath(locale, href)} className="flex h-14 items-center gap-3 px-5 font-semibold">
            <span aria-hidden="true">{icon}</span>
            <span className="flex-1">{label}</span>
            <span className="text-muted" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </nav>

      <form action={logoutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="flex h-14 w-full items-center justify-center rounded-2xl bg-white font-bold text-brand ring-1 ring-sand">
          {t.logout}
        </button>
      </form>

      <details className="rounded-3xl bg-white p-5 ring-1 ring-sand">
        <summary className="cursor-pointer font-bold text-brand-dark">{t.delete}</summary>
        <form action={deleteMyAccount} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="locale" value={locale} />
          <p className="text-sm text-muted">{t.deleteText}</p>
          <label className="flex items-center gap-3 font-medium">
            <input type="checkbox" name="confirm" value="oui" required className="h-5 w-5" />
            {t.confirm}
          </label>
          <button type="submit" className="flex h-12 items-center justify-center rounded-2xl bg-brand-dark px-6 font-bold text-white">
            {t.deleteButton}
          </button>
        </form>
      </details>
    </>
  );
}
