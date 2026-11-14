"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localePath, stripLocale, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

// Morceaux de l'en-tête et du pied de page qui changent avec la langue (/en/… → anglais).

const COOKIE = "lang";
const remember = (locale: Locale) => {
  document.cookie = `${COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
};

/** Met <html lang> à jour quand on change de langue sans recharger la page. */
export function HtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

/** Bouton FR / EN : même page dans l'autre langue. Petit écran : seulement la langue cible. */
export function LanguageSwitch() {
  const locale = useLocale();
  const path = stripLocale(usePathname() ?? "/");
  const other: Locale = locale === "fr" ? "en" : "fr";
  const item = (l: Locale) => (
    <Link
      key={l}
      href={localePath(l, path)}
      onClick={() => remember(l)}
      hrefLang={l}
      aria-current={l === locale ? "true" : undefined}
      aria-label={l === "fr" ? "Version française" : "English version"}
      className={`flex h-8 items-center rounded-full px-2.5 text-xs font-bold transition ${
        l === locale ? "bg-ink text-cream" : "text-muted hover:text-ink"
      }`}
    >
      {l.toUpperCase()}
    </Link>
  );
  return (
    <>
      <div className="hidden items-center rounded-full bg-white p-1 ring-1 ring-sand md:flex">{(["fr", "en"] as const).map(item)}</div>
      <Link
        href={localePath(other, path)}
        onClick={() => remember(other)}
        hrefLang={other}
        aria-label={other === "fr" ? "Version française" : "English version"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold ring-1 ring-sand min-[400px]:h-10 min-[400px]:w-10 md:hidden"
      >
        {other.toUpperCase()}
      </Link>
    </>
  );
}

/**
 * Téléphone réglé dans l'autre langue, premier passage : on propose la bonne version, sans rediriger
 * (une redirection automatique empêcherait Google de voir la version française).
 */
export function LanguageSuggestion() {
  const locale = useLocale();
  const path = stripLocale(usePathname() ?? "/");
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`))) return;
    const prefersEn = (navigator.languages ?? [navigator.language]).find((l) => /^(en|fr)/i.test(l))?.toLowerCase().startsWith("en");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du navigateur, une seule fois
    setShow(locale === "fr" ? !!prefersEn : prefersEn === false);
  }, [locale]);
  if (!show || path.startsWith("/admin")) return null;
  const target: Locale = locale === "fr" ? "en" : "fr";
  const close = () => {
    remember(locale);
    setShow(false);
  };
  return (
    <div className="flex items-center justify-center gap-3 bg-ink px-4 py-2 text-sm text-cream" role="region" aria-label="Language">
      <span>{target === "en" ? "This site is also in English." : "Ce site existe aussi en français."}</span>
      <Link href={localePath(target, path)} onClick={() => remember(target)} className="font-bold underline">
        {target === "en" ? "Switch to English" : "Passer en français"}
      </Link>
      <button type="button" onClick={close} aria-label={locale === "en" ? "Close" : "Fermer"} className="ml-1 px-1 text-cream/70">
        ✕
      </button>
    </div>
  );
}

const NAV: Record<Locale, [string, string][]> = {
  fr: [
    ["/#exemples", "Exemples"],
    ["/#etapes", "Comment ça marche"],
    ["/#faq", "Questions"],
  ],
  en: [
    ["/#exemples", "Examples"],
    ["/#etapes", "How it works"],
    ["/#faq", "FAQ"],
  ],
};

export function MainNav() {
  const locale = useLocale();
  return (
    <nav
      aria-label={locale === "en" ? "Main navigation" : "Navigation principale"}
      className="hidden items-center gap-1 rounded-full bg-white/70 p-1 text-sm font-medium ring-1 ring-sand md:flex"
    >
      {NAV[locale].map(([href, label]) => (
        <Link key={href} href={localePath(locale, href)} className="rounded-full px-4 py-2 text-muted transition hover:bg-sand/60 hover:text-ink">
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function HomeLink({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  return (
    <Link href={localePath(locale, "/")} aria-label={locale === "en" ? "Dédikace, home" : "Dédikace, accueil"} className="shrink-0">
      {children}
    </Link>
  );
}

export function AccountLink() {
  const locale = useLocale();
  const label = locale === "en" ? "My space" : "Mon espace";
  return (
    <Link
      href={localePath(locale, "/compte")}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink ring-1 ring-sand transition active:scale-95 max-[399px]:hidden md:h-11 md:w-11"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </svg>
    </Link>
  );
}

export type FooterOccasion = { slug: string; name: string; nameEn: string };

export function SiteFooter({ occasions, cookies }: { occasions: FooterOccasion[]; cookies: React.ReactNode }) {
  const locale = useLocale();
  const en = locale === "en";
  const to = (p: string) => localePath(locale, p);
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 text-sm text-muted md:px-8">
      <nav aria-label={en ? "Songs by occasion" : "Chansons par occasion"} className="flex flex-col gap-2 border-t border-sand py-6">
        <p className="font-bold text-ink">{en ? "A personalised song for…" : "Une chanson personnalisée pour…"}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {occasions.map((p) => (
            <li key={p.slug}>
              <Link href={to(`/chanson/${p.slug}`)} className="hover:text-ink hover:underline">
                {en ? p.nameEn : p.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label={en ? "Legal information" : "Informations légales"} className="flex flex-wrap gap-x-4 gap-y-2 border-t border-sand pt-6">
        <Link href={to("/cgu")} className="underline">
          {en ? "Terms" : "Conditions"}
        </Link>
        <Link href={to("/confidentialite")} className="underline">
          {en ? "Privacy" : "Confidentialité"}
        </Link>
        <Link href={to("/remboursement")} className="underline">
          {en ? "Refunds" : "Remboursement"}
        </Link>
        <Link href={to("/cgu#mentions-legales")} className="underline">
          {en ? "Legal notice" : "Mentions légales"}
        </Link>
        <Link href={to("/compte")} className="underline">
          {en ? "My space" : "Mon espace"}
        </Link>
        {cookies}
        <span className="ml-auto">© Darthie Studios</span>
      </nav>
    </footer>
  );
}
