import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Image from "next/image";
import { Suspense } from "react";
import { env } from "@/lib/env";
import { OCCASION_PAGES } from "@/lib/seo-pages";
import { HeaderCta } from "@/components/HeaderCta";
import { AccountLink, HomeLink, HtmlLang, LanguageSuggestion, LanguageSwitch, MainNav, SiteFooter } from "@/components/SiteChrome";
import { CookieSettingsLink, Pixels } from "@/components/Pixels";
import { SingleAudio } from "@/components/SingleAudio";
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

const logo = (
  <Image
    src="/brand/logo-couleur.svg"
    alt="Dédikace"
    width={432}
    height={100}
    priority
    unoptimized
    className="h-6 w-auto min-[360px]:h-7 md:h-9"
  />
);

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : certaines extensions de navigateur ajoutent des attributs à <html>.
    <html lang="fr" className={`${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {/* Les morceaux qui suivent la langue lisent l'adresse : sous <Suspense> (pages à identifiant, Cache Components). */}
        <Suspense fallback={null}>
          <LanguageSuggestion />
        </Suspense>
        <header className="sticky top-0 z-40 border-b border-sand/60 bg-cream/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 max-[359px]:px-3 md:gap-4 md:px-8">
            <Suspense fallback={logo}>
              <HomeLink>{logo}</HomeLink>
            </Suspense>
            <Suspense fallback={null}>
              <MainNav />
            </Suspense>
            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
              <Suspense fallback={null}>
                <LanguageSwitch />
                <AccountLink />
                <HeaderCta />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <Suspense fallback={null}>
          <SiteFooter
            occasions={OCCASION_PAGES.map(({ slug, name, nameEn }) => ({ slug, name, nameEn }))}
            cookies={<CookieSettingsLink enabled={!!env.META_PIXEL_ID} />}
          />
          <WhatsAppButton />
          <HtmlLang />
        </Suspense>
        <Suspense fallback={null}>
          <Pixels metaId={env.META_PIXEL_ID} />
        </Suspense>
        <SingleAudio />
        <WebAnalytics />
      </body>
    </html>
  );
}
