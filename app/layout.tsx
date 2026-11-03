import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { env } from "@/lib/env";
import { HeaderCta } from "@/components/HeaderCta";
import { Pixels } from "@/components/Pixels";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import "./globals.css";

// Une seule police variable : un seul fichier à télécharger en 3G.
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: { default: "Dédikace — Ton nom dans une chanson", template: "%s · Dédikace" },
  description:
    "Une chanson personnalisée en quelques minutes, sur des rythmes d'Afrique centrale : anniversaire, mariage, dot, hommage, réussite…",
};

export const viewport: Viewport = {
  themeColor: "#e0451b",
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
            <Link href="/" className="text-xl font-extrabold tracking-tight text-brand md:text-2xl">
              Dédikace<span className="text-gold">.</span>
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
            <Suspense fallback={null}>
              <HeaderCta />
            </Suspense>
          </div>
        </header>
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 text-sm text-muted md:px-8">
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
            <span className="ml-auto">© Darthie Studios</span>
          </nav>
        </footer>
        <WhatsAppButton />
        <Suspense fallback={null}>
          <Pixels metaId={env.META_PIXEL_ID} tiktokId={env.TIKTOK_PIXEL_ID} />
        </Suspense>
      </body>
    </html>
  );
}
