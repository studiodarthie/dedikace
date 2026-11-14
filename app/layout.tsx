import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { env } from "@/lib/env";
import { OCCASION_PAGES } from "@/lib/seo-pages";
import { HeaderCta } from "@/components/HeaderCta";
import { CookieSettingsLink, Pixels } from "@/components/Pixels";
import { WebAnalytics } from "@/components/WebAnalytics";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import "./globals.css";

// Une seule police variable : un seul fichier à télécharger en 3G.
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: { default: "Dédikace — Chanson personnalisée avec ton prénom", template: "%s · Dédikace" },
  description:
    "Offre une chanson personnalisée avec le prénom au refrain : anniversaire, mariage, dot, hommage, réussite. Makossa, bikutsi, afrobeats, rumba. Paroles gratuites, prête en 2 minutes, paiement Mobile Money.",
  applicationName: "Dédikace",
  keywords: [
    "chanson personnalisée",
    "chanson avec prénom",
    "chanson d'anniversaire personnalisée",
    "chanson pour la dot",
    "chanson de mariage",
    "chanson hommage",
    "cadeau original Cameroun",
    "makossa",
    "bikutsi",
    "afrobeats",
  ],
  openGraph: { type: "website", siteName: "Dédikace", locale: "fr_CM" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#d9401a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : certaines extensions de navigateur ajoutent des attributs à <html>.
    <html lang="fr" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-sand/60 bg-cream/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
            <Link href="/" aria-label="Dédikace, accueil" className="shrink-0">
              <Image
                src="/brand/logo-couleur.svg"
                alt="Dédikace"
                width={432}
                height={100}
                priority
                unoptimized
                className="h-7 w-auto md:h-9"
              />
            </Link>
            <nav aria-label="Navigation principale" className="hidden items-center gap-1 rounded-full bg-white/70 p-1 text-sm font-medium ring-1 ring-sand md:flex">
              {[
                ["/#exemples", "Exemples"],
                ["/#etapes", "Comment ça marche"],
                ["/#faq", "Questions"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="rounded-full px-4 py-2 text-muted transition hover:bg-sand/60 hover:text-ink">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="/compte"
                aria-label="Mon espace"
                title="Mon espace"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink ring-1 ring-sand transition active:scale-95 md:h-11 md:w-11"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                </svg>
              </Link>
              <Suspense fallback={null}>
                <HeaderCta />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 text-sm text-muted md:px-8">
          <nav aria-label="Chansons par occasion" className="flex flex-col gap-2 border-t border-sand py-6">
            <p className="font-bold text-ink">Une chanson personnalisée pour…</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {OCCASION_PAGES.map((p) => (
                <li key={p.slug}>
                  <Link href={`/chanson/${p.slug}`} className="hover:text-ink hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-4 gap-y-2 border-t border-sand pt-6">
            <Link href="/cgu" className="underline">
              Conditions
            </Link>
            <Link href="/confidentialite" className="underline">
              Confidentialité
            </Link>
            <Link href="/remboursement" className="underline">
              Remboursement
            </Link>
            <Link href="/cgu#mentions-legales" className="underline">
              Mentions légales
            </Link>
            <CookieSettingsLink enabled={!!env.META_PIXEL_ID} />
            <span className="ml-auto">© Darthie Studios</span>
          </nav>
        </footer>
        <WhatsAppButton />
        <Suspense fallback={null}>
          <Pixels metaId={env.META_PIXEL_ID} />
        </Suspense>
        <WebAnalytics />
      </body>
    </html>
  );
}
